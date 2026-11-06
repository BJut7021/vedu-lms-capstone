"""Audit a completed benchmark and produce reusable evidence without updating LMS data."""
import argparse
import hashlib
import json
import shutil
import sys
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    source, out = Path(args.input).resolve(), Path(args.output).resolve()
    out.mkdir(parents=True, exist_ok=True)
    frame = pd.read_csv(source / 'model-results.csv')
    seeds = {13, 21, 42, 77, 101}
    assert len(frame) == 160, f'Expected 160 model rows, found {len(frame)}'
    assert not frame.duplicated(['dataset', 'protocol', 'seed', 'model']).any()
    assert frame.environment.eq('local').all(), 'This evidence exporter describes LOCAL execution'
    groups = frame.groupby(['dataset', 'protocol', 'model'])
    assert len(groups) == 32 and all(set(g.seed) == seeds for _, g in groups)
    sys.path.insert(0, str(root / 'ml-core'))
    from engine import predict
    checks = []
    manifests = []
    for report_file in sorted(source.glob('*/*/seed-*/report.json')):
        run = report_file.parent
        report = json.loads(report_file.read_text(encoding='utf-8'))
        manifest = report['manifest']
        manifests.append({'run': str(run.relative_to(source)), 'manifest': manifest,
                          'metrics': report['metrics'], 'mining': report['mining'],
                          'artifact_sha256': report['artifact_sha256']})
        ranks = pd.read_csv(run / 'per_user_ranks.csv')
        assert hashlib.sha256((run / 'models.pt').read_bytes()).hexdigest() == report['artifact_sha256']
        assert any(w[2] == 0 for w in manifest['hybrid_weight_candidates'])
        for model, group in ranks[ranks.split == 'test'].groupby('model'):
            known = group[group.unsupported_reason.isna()]
            k = min(3, manifest['items'])
            assert np.isclose((known['rank'] <= k).mean(), report['metrics'][model]['test'][f'Recall@{k}'])
            ndcg = np.where(known['rank'] <= k, 1 / np.log2(known['rank'] + 1), 0).mean()
            assert np.isclose(ndcg, report['metrics'][model]['test'][f'NDCG@{k}'])
            all_recall = (group['rank'] <= k).sum() / len(group)
            assert np.isclose(all_recall, report['metrics'][model]['test_all_targets'][f'Recall@{k}'])
        prediction = predict(run, report['items'][:2])
        assert prediction['scores'] and all(np.isfinite(v['score']) for v in prediction['scores'])
        checks.append({'run': str(run.relative_to(source)), 'items': manifest['items'],
                       'users': manifest['users'], 'train_rows': manifest['train_rows'],
                       'dataset': manifest['dataset'], 'protocol': manifest['split_protocol'], 'seed': manifest['seed'],
                       'test_known_history': report['metrics']['BPR-MF']['test']['evaluated_users'],
                       'test_all_targets': report['metrics']['BPR-MF']['test_all_targets']['total_target_users'],
                       'test_unsupported': manifest['test_skipped_cold'],
                       'model_sha256': report['artifact_sha256'], 'rank_rows': len(ranks),
                       'hybrid_weights': manifest['hybrid_weights'],
                       'patterns': len(report['patterns']), 'reload_prediction': 'PASS'})
    assert len(checks) == 20
    (out / 'run-manifests.json').write_text(json.dumps(manifests, indent=2), encoding='utf-8')
    pd.DataFrame(checks)[['dataset', 'protocol', 'seed', 'users', 'items', 'train_rows',
                          'test_known_history', 'test_all_targets', 'test_unsupported']].to_csv(out / 'evaluation-population.csv', index=False)
    metrics = ['Recall@3', 'NDCG@3', 'MRR@3', 'all_NDCG@3', 'catalog_coverage@10']
    summary = groups[metrics].agg(['mean', 'std', 'count'])
    summary.to_csv(out / 'model-summary.csv')
    frame.to_csv(out / 'model-results.csv', index=False)
    shutil.copy2(source / 'research-lock.json', out / 'research-lock.json')
    hybrid = frame[frame.model.eq('Hybrid BPR+GRU+HUSPM')]
    ablation = frame[frame.model.eq('BPR+GRU without HUSPM (ablation)')]
    paired = hybrid.merge(ablation, on=['dataset', 'protocol', 'seed'], suffixes=('_hybrid', '_ablation'))
    paired['delta_NDCG@3'] = paired['NDCG@3_hybrid'] - paired['NDCG@3_ablation']
    paired['delta_Recall@3'] = paired['Recall@3_hybrid'] - paired['Recall@3_ablation']
    paired[['dataset', 'protocol', 'seed', 'huspm_weight_hybrid', 'delta_NDCG@3', 'delta_Recall@3']].to_csv(out / 'huspm-ablation.csv', index=False)
    audit = {'environment': 'local CPU', 'completed_runs': len(checks), 'model_rows': len(frame),
             'epochs': sorted(frame.epochs.unique().tolist()), 'seeds': sorted(seeds),
             'checks': checks, 'hybrid_huspm_weight_zero_runs': int((hybrid.huspm_weight == 0).sum()),
             'limitations': [
                 'Kaggle-hosted data does not by itself establish real learner provenance.',
                 'The small module catalog makes Random Recall@3 intrinsically high.',
                 'Recall/NDCG measure next-item ranking, not learning gains or curriculum validity.',
                 'Per-user temporal is a warm-history diagnostic; global temporal is the deployment protocol.',
                 'Five seeds quantify initialization variance, not five independent datasets.',
                 'No test-set tuning; zero HUSPM weights and negative ablation deltas must be reported.',
                 'A local result is not evidence of execution on Kaggle.'
             ]}
    (out / 'validation.json').write_text(json.dumps(audit, indent=2), encoding='utf-8')
    labels = {
        'BPR-MF': 'BPR', 'GRU-next-item': 'GRU', 'Item-KNN (sklearn external)': 'Item-KNN',
        'Popularity (train-only)': 'Popularity', 'HUSPM-only': 'HUSPM',
        'BPR+GRU without HUSPM (ablation)': 'BPR+GRU', 'Hybrid BPR+GRU+HUSPM': 'Hybrid',
        'Random (seeded)': 'Random',
    }
    for metric, filename in [('NDCG@3', 'ndcg-at-3.png'), ('Recall@3', 'recall-at-3.png')]:
        fig, axes = plt.subplots(2, 2, figsize=(14, 9), constrained_layout=True)
        for ax, ((dataset, protocol), values) in zip(axes.flat, frame.groupby(['dataset', 'protocol'], sort=True)):
            scores = values.groupby('model')[metric].agg(['mean', 'std']).reindex(labels)
            ax.bar(range(len(scores)), scores['mean'], yerr=scores['std'], capsize=3,
                   color=['#94a3b8', '#60a5fa', '#a78bfa', '#cbd5e1', '#fb923c', '#2dd4bf', '#2563eb', '#fbbf24'])
            ax.set_xticks(range(len(scores)), labels.values(), rotation=35, ha='right')
            ax.set_ylim(0, 1.05)
            ax.set_ylabel(metric)
            ax.set_title(f'{dataset} / {protocol}', fontsize=11)
            ax.grid(axis='y', alpha=.18)
            ax.set_axisbelow(True)
        fig.suptitle(f'VEDU local CPU: {metric}, mean +/- SD over 5 seeds (20 epochs)\nKnown training-catalog targets with history; see all-target results and evaluation-population.csv', fontsize=12)
        fig.savefig(out / filename, dpi=180)
        plt.close(fig)
    # Execute an analysis notebook against the actual saved outputs. This is not
    # presented as an executed Kaggle training notebook.
    import nbformat
    from nbclient import NotebookClient
    notebook = nbformat.v4.new_notebook(cells=[
        nbformat.v4.new_markdown_cell('# VEDU executed LOCAL analysis\n20 training runs, 2 datasets, 2 temporal protocols, 5 seeds. Training ran via benchmark.py; this notebook audits and displays its saved outputs. No Kaggle execution is claimed.'),
        nbformat.v4.new_code_cell('from pathlib import Path\nimport json, pandas as pd\nfrom IPython.display import display, Image\nROOT = Path.cwd()\nresults = pd.read_csv(ROOT / "model-results.csv")\nassert len(results) == 160\nprint("Environment: local CPU; completed model rows:", len(results))\ndisplay(pd.read_csv(ROOT / "model-summary.csv", header=[0,1], index_col=[0,1,2]))'),
        nbformat.v4.new_code_cell('display(pd.read_csv(ROOT / "huspm-ablation.csv"))\naudit = json.loads((ROOT / "validation.json").read_text())\nprint("Artifact reload and per-user rank checks:", audit["completed_runs"])\nprint("Zero HUSPM weight runs:", audit["hybrid_huspm_weight_zero_runs"])\nprint("\\n".join(audit["limitations"]))'),
        nbformat.v4.new_code_cell('display(Image(filename=str(ROOT / "ndcg-at-3.png")))\ndisplay(Image(filename=str(ROOT / "recall-at-3.png")))'),
    ])
    NotebookClient(notebook, timeout=180, kernel_name='python3', resources={'metadata': {'path': str(out)}}).execute()
    nbformat.write(notebook, out / 'VEDU_Local_Analysis.executed.ipynb')
    kaggle_notebook = root / '.work' / 'research-kaggle' / 'VEDU_Research_5Seeds_2Protocols.ipynb'
    if kaggle_notebook.exists():
        shutil.copy2(kaggle_notebook, out / 'VEDU_Kaggle_Training.ready.ipynb')
    snapshots = source / 'source-snapshot'
    snapshots.mkdir(exist_ok=True)
    for name in ['engine.py', 'benchmark.py', 'requirements.txt']:
        shutil.copy2(root / 'ml-core' / name, snapshots / name)
    for name in ['summarize-research.py', 'check-huspm.py']:
        shutil.copy2(root / 'scripts' / name, snapshots / name)
    for evidence in out.iterdir():
        if evidence.is_file():
            shutil.copy2(evidence, source / evidence.name)
    digests = {str(p.relative_to(source)).replace('\\', '/'): hashlib.sha256(p.read_bytes()).hexdigest()
               for p in sorted(source.rglob('*')) if p.is_file() and p.name != 'SHA256SUMS.json'}
    (source / 'SHA256SUMS.json').write_text(json.dumps(digests, indent=2), encoding='utf-8')
    archive = shutil.make_archive(str(source), 'zip', source)
    (out / 'artifact-archive.json').write_text(json.dumps({
        'archive': str(Path(archive).relative_to(root)),
        'sha256': hashlib.sha256(Path(archive).read_bytes()).hexdigest(),
        'file_count': len(digests),
    }, indent=2), encoding='utf-8')
    print(json.dumps({'validation': 'PASS', 'runs': len(checks), 'rows': len(frame), 'evidence': str(out), 'archive': archive}, indent=2))


if __name__ == '__main__':
    main()
