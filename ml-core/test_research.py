import json
import tempfile
import unittest
from pathlib import Path
import pandas as pd
from engine import metrics, train, predict


class ResearchTests(unittest.TestCase):
    def test_metrics_and_ranks(self):
        ranks=[]
        m=metrics([(0,[0],1)],lambda u,h:[3,2,1],3,ranks)
        self.assertEqual(ranks,[2])
        self.assertEqual(m['Recall@1'],0)
        self.assertAlmostEqual(m['NDCG@3'],1/__import__('math').log2(3))

    def test_both_splits_training_only_and_artifact_reload(self):
        rows=[{'user':str(u),'item':str((u+t)%4),'time':f'2026-01-{t+1:02}T00:00:00Z','utility':1+(t%3)} for u in range(6) for t in range(12)]
        with tempfile.TemporaryDirectory() as tmp:
            for protocol in ['global_temporal','per_user_temporal']:
                dest=Path(tmp)/protocol
                r=train('vedu_real',tmp,dest,{'epochs':1,'dimensions':8,'protocol':protocol},rows)
                self.assertEqual(r['manifest']['split_protocol'],protocol)
                self.assertIn((.5,.5,0.0),r['manifest']['hybrid_weight_candidates'])
                self.assertEqual(r['manifest']['train_rows'],48 if protocol=='global_temporal' else 60)
                self.assertIn('Random (seeded)',r['metrics'])
                ranks=pd.read_csv(dest/'per_user_ranks.csv')
                self.assertEqual(len(ranks),96)
                self.assertTrue(ranks['rank'].between(1,4).all())
                self.assertTrue(predict(dest,['0','1'])['scores'])
                loaded=json.loads((dest/'report.json').read_text())
                self.assertEqual(loaded['manifest']['code_sha256'],r['manifest']['code_sha256'])
                for model,group in ranks[ranks.split=='test'].groupby('model'):
                    self.assertAlmostEqual((group['rank']<=3).mean(),r['metrics'][model]['test']['Recall@3'])


if __name__=='__main__':unittest.main()
