"""Offline research runner, shared by Kaggle and PyCharm. Never updates the LMS DB."""
import argparse
import hashlib
import json
import platform
import subprocess
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
from engine import train


def fingerprint(data):
    return {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(Path(data).glob('*.csv'))}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--data', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--epochs', type=int, default=20)
    parser.add_argument('--seeds', nargs='+', type=int, default=[13,21,42,77,101])
    parser.add_argument('--datasets', nargs='+', default=['kaggle_logs','kaggle_recommender'])
    parser.add_argument('--protocols', nargs='+', default=['global_temporal','per_user_temporal'])
    parser.add_argument('--environment', choices=['local','kaggle'], default='local')
    args = parser.parse_args()
    output = Path(args.output); output.mkdir(parents=True, exist_ok=True)
    source = Path(__file__).parent
    try:
        revision = subprocess.check_output(['git','rev-parse','HEAD'], cwd=source, text=True, stderr=subprocess.DEVNULL).strip()
    except (OSError,subprocess.CalledProcessError):
        lock=source/'research-lock.json'
        revision=json.loads(lock.read_text())['base_commit'] if lock.exists() else 'source-upload'
    lock = {'base_commit':revision,'environment':args.environment,'created_at':datetime.now(timezone.utc).isoformat(),
            'python':platform.python_version(),'dataset_sha256':fingerprint(args.data),
            'source_sha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in source.glob('*.py')},
            'arguments':vars(args),'device':'CPU; engine does not use CUDA'}
    (output/'research-lock.json').write_text(json.dumps(lock,indent=2),encoding='utf-8')
    rows=[]
    for dataset in args.datasets:
        for protocol in args.protocols:
            for seed in args.seeds:
                config={'epochs':args.epochs,'seed':seed,'dimensions':32,'min_support':.02,'utility_ratio':.01,'max_length':3,'protocol':protocol,'source_revision':revision}
                dest=output/dataset/protocol/f'seed-{seed}'
                print(f'TRAIN {dataset} {protocol} seed={seed}',flush=True)
                report=train(dataset,args.data,dest,config)
                for model,metrics in report['metrics'].items():
                    row={'dataset':dataset,'protocol':protocol,'seed':seed,'model':model,'environment':args.environment,
                         'epochs':args.epochs,'items':report['manifest']['items'],'patterns':len(report['patterns']),
                         'runtime_seconds':report['manifest']['runtime_seconds'],'huspm_weight':report['manifest']['hybrid_weights'][2]}
                    row.update(metrics['test'])
                    row.update({'all_'+k:v for k,v in metrics['test_all_targets'].items()})
                    rows.append(row)
                frame=pd.DataFrame(rows)
                frame.to_csv(output/'model-results.csv',index=False)
                summary=frame.groupby(['dataset','protocol','model'])[['Recall@1','Recall@3','NDCG@3','MRR@3','all_NDCG@3','catalog_coverage@10']].agg(['mean','std','count'])
                summary.to_csv(output/'model-summary.csv')
                print(f'DONE {dataset} {protocol} seed={seed}: {report["manifest"]["runtime_seconds"]}s',flush=True)
    print(f'COMPLETE: {len(rows)} model rows, {len(args.datasets)*len(args.protocols)*len(args.seeds)} runs -> {output}',flush=True)


if __name__=='__main__': main()
