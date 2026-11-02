"""Audit saved ranks against published metrics without retraining or changing them."""
import argparse
import hashlib
import json
import math
from pathlib import Path
import csv

parser=argparse.ArgumentParser()
parser.add_argument('results',type=Path)
args=parser.parse_args()
reports=list(args.results.glob('*/*/seed-*/report.json'))
assert len(reports)==20, f'Expected 20 runs; found {len(reports)}'
identities=set(); checked=0
for file in reports:
    report=json.loads(file.read_text(encoding='utf-8'))
    m=report['manifest']; cfg=m['config']
    identities.add((m['dataset'],m['split_protocol'],m['seed']))
    assert cfg['epochs']==20
    assert abs(sum(m['hybrid_weights'])-1)<1e-8
    assert any(w[2]==0 for w in m['hybrid_weight_candidates'])
    assert hashlib.sha256((file.parent/'models.pt').read_bytes()).hexdigest()==report['artifact_sha256']
    with (file.parent/'per_user_ranks.csv').open(encoding='utf-8') as stream: rows=list(csv.DictReader(stream))
    for model,measured in report['metrics'].items():
        tests=[r for r in rows if r['model']==model and r['split']=='test']
        known=[r for r in tests if r['rank']]
        assert len(known)==measured['test']['evaluated_users']
        assert len(tests)==measured['test_all_targets']['total_target_users']
        for k in [1,3,5,10]:
            if k>m['items']:continue
            def value(row,metric):
                rank=float(row['rank']) if row['rank'] else math.inf
                if rank>k:return 0
                return 1 if metric=='Recall' else (1/math.log2(rank+1) if metric=='NDCG' else 1/rank)
            for metric in ['Recall','NDCG','MRR']:
                assert abs(sum(value(r,metric) for r in known)/len(known)-measured['test'][f'{metric}@{k}'])<1e-10
                assert abs(sum(value(r,metric) for r in tests)/len(tests)-measured['test_all_targets'][f'{metric}@{k}'])<1e-10
                checked+=2
assert len(identities)==20
with (args.results/'model-results.csv').open(encoding='utf-8') as stream: summary=list(csv.DictReader(stream))
assert len(summary)==160
result={'status':'PASS','completed_runs':len(reports),'model_rows':len(summary),'metric_equalities_checked':checked,
        'scope':'Recomputed all saved test Recall/NDCG/MRR from anonymous per-user ranks, including unsupported targets as misses; verified model file SHA256 and zero-HUSPM candidate.'}
(args.results/'validation.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result,indent=2))
