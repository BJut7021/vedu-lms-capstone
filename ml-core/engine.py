"""Reproducible next-item experiments. External data never masquerades as VEDU logs."""
import hashlib
import json
import math
import time
import platform
from pathlib import Path

import numpy as np
import pandas as pd
import torch
import sklearn
from scipy.sparse import csr_matrix
from sklearn.neighbors import NearestNeighbors
from torch import nn

VERSION = 'vedu-huspm-bpr-gru-1.0'
SOURCES = {
    'kaggle_logs': 'https://www.kaggle.com/datasets/ziya07/student-learning-interaction-logs-dataset',
    'kaggle_recommender': 'https://www.kaggle.com/datasets/nhondangcode/e-learning-recommender-system-dataset',
    'vedu_real': 'VEDU PostgreSQL: learning.learning_sequence_logs WHERE data_source=REAL',
}

def load_dataset(name, data_dir, rows=None):
    root = Path(data_dir)
    if name == 'vedu_real':
        df = pd.DataFrame(rows or [])
        required = {'user', 'item', 'time', 'utility'}
        if not required.issubset(df.columns):
            raise ValueError('VEDU needs REAL events with user/item/time/utility')
        hashes = {'real_export_sha256': hashlib.sha256(json.dumps(rows, sort_keys=True).encode()).hexdigest()}
    else:
        filename = 'student_learning_interaction_dataset.csv' if name == 'kaggle_logs' else 'implicit_ratings_en.csv'
        path = root / filename
        raw = pd.read_csv(path)
        hashes = {filename: hashlib.sha256(path.read_bytes()).hexdigest()}
        if name == 'kaggle_logs':
            df = raw.rename(columns={'student_id':'user','module_id':'item','timestamp':'time'})[['user','item','time']].copy()
            # Only contemporaneous fields. No next_module_prediction, cumulative scores or labels.
            df['utility'] = 1 + raw.time_spent_minutes.clip(0, 60) / 10 + raw.quiz_score.clip(0, 100) / 100
        elif name == 'kaggle_recommender':
            df = raw.rename(columns={'user_id':'user','item_id':'item','created_at':'time'})[['user','item','time']].copy()
            df['utility'] = 1.0  # Clicks provide no score/duration: neutral utility, explicit limitation.
        else:
            raise ValueError('Unknown dataset')
    original = len(df)
    df['time'] = pd.to_datetime(df['time'], errors='coerce', utc=True)
    df = df.dropna(subset=['user','item','time','utility']).copy()
    df['user'], df['item'] = df.user.astype(str), df.item.astype(str)
    df['utility'] = pd.to_numeric(df.utility, errors='coerce').clip(lower=0.01,upper=20)
    df = df.dropna().sort_values(['time','user','item'],kind='stable').reset_index(drop=True)
    return df, {'source':SOURCES[name],'hashes':hashes,'raw_rows':original,'clean_rows':len(df),
                'dropped_rows':original-len(df),'units':'timestamps UTC, durations seconds, utility dimensionless',
                'limitations': 'Kaggle hosting does not prove real collection; author provenance/license must be confirmed. Naive timestamps are assumed UTC for relative ordering, not verified original timezone. Timestamp ties have deterministic, not observed, ordering.'}

def mine_huspm(sequences, min_support=0.02, utility_ratio=0.01, max_length=3, max_candidates=200000):
    """Exact bounded singleton-itemset HUSPM using prefix projection and SWU pruning.
    Pattern utility = sum of MAX embedding utility in each containing sequence.
    Carries every matching end position, not just the first embedding.
    """
    n = len(sequences)
    if not n: return [], {'total_utility':0,'candidates':0,'min_utility':0}
    totals = [sum(v for _,v in s) for s in sequences]
    threshold = sum(totals)*utility_ratio
    minimum = max(1,math.ceil(n*min_support))
    patterns, visited = [], 0
    def visit(prefix, projected):
        nonlocal visited
        children = {}
        for sid, ends in projected.items():
            seq = sequences[sid]
            # Running best prefix utility before each position; optimal embeddings retained.
            best = -math.inf
            for pos,(item,value) in enumerate(seq):
                if pos-1 in ends: best=max(best,ends[pos-1])
                if best > -math.inf:
                    children.setdefault(item,{}).setdefault(sid,{})[pos]=best+value
        for item,projection in sorted(children.items()):
            visited+=1
            if visited>max_candidates: raise ValueError('HUSPM candidate limit: raise min_support/min_utility or lower max_length. No partial run is accepted.')
            if len(projection)<minimum or sum(totals[sid] for sid in projection)<threshold: continue
            candidate=prefix+[item]
            utility=sum(max(ends.values()) for ends in projection.values())
            if utility>=threshold:
                patterns.append({'items':candidate,'support_count':len(projection),'support':len(projection)/n,'utility':utility,'utility_ratio':utility/sum(totals)})
            if len(candidate)<max_length: visit(candidate,projection)
    visit([], {sid:{-1:0.0} for sid in range(n)})
    return sorted(patterns,key=lambda p:(-p['utility'],p['items'])), {'total_utility':sum(totals),'min_utility':threshold,'candidates':visited,'sequence_count':n,'exact_within_max_length':max_length}

class BPR(nn.Module):
    def __init__(self, users, items, dim):
        super().__init__()
        self.users=nn.Embedding(users,dim); self.items=nn.Embedding(items,dim)
        nn.init.normal_(self.users.weight,std=0.05); nn.init.normal_(self.items.weight,std=0.05)
    def loss(self,u,i,j):
        a,b,c=self.users(u),self.items(i),self.items(j)
        return -nn.functional.logsigmoid((a*(b-c)).sum(-1)).mean()+0.0001*(a.square().mean()+b.square().mean()+c.square().mean())

class NextGRU(nn.Module):
    def __init__(self,items,dim):
        super().__init__()
        self.embedding=nn.Embedding(items+1,dim,padding_idx=0)
        self.gru=nn.GRU(dim,dim,batch_first=True)
        self.output=nn.Linear(dim,items)
    def forward(self,x):
        _,h=self.gru(self.embedding(x))
        return self.output(h[-1])

def normalized(scores):
    scores=np.asarray(scores,dtype=float)
    if len(scores)==0: return scores
    return (scores-scores.min())/(scores.max()-scores.min()+1e-12)

def huspm_scores(history,patterns,count):
    scores=np.zeros(count)
    for pattern in patterns:
        prefix=pattern['items'][:-1]
        if not prefix: continue
        cursor=0
        for item in history:
            if cursor<len(prefix) and item==prefix[cursor]: cursor+=1
        if cursor==len(prefix): scores[pattern['items'][-1]]+=pattern['utility_ratio']*pattern['support']
    return normalized(scores)

def metrics(cases,score_fn,item_count):
    result={f'{metric}@{k}':0.0 for k in (1,3,5,10) if k<=item_count for metric in ('Recall','NDCG','MRR')}
    coverage=set()
    for user,history,target in cases:
        scores=score_fn(user,history)
        ranking=np.argsort(-scores,kind='stable')
        coverage.update(ranking[:min(10,item_count)].tolist())
        rank=int(np.where(ranking==target)[0][0])+1
        for k in (1,3,5,10):
            if k>item_count: continue
            result[f'Recall@{k}']+=float(rank<=k)
            result[f'NDCG@{k}']+=(1/math.log2(rank+1) if rank<=k else 0)
            result[f'MRR@{k}']+=(1/rank if rank<=k else 0)
    for key in result: result[key]=result[key]/len(cases) if cases else None
    for k in (1,3,5,10):
        if k>item_count or not cases:continue
        p=result[f'Recall@{k}'];n=len(cases);z=1.96;den=1+z*z/n
        centre=(p+z*z/(2*n))/den
        margin=z*math.sqrt(p*(1-p)/n+z*z/(4*n*n))/den
        result[f'Recall@{k}_ci95']=[max(0,centre-margin),min(1,centre+margin)]
    result.update({'evaluated_users':len(cases),'catalog_coverage@10':len(coverage)/item_count})
    return result

def train(dataset,data_dir,output,config=None,rows=None):
    config=config or {}; seed=int(config.get('seed',42)); epochs=int(config.get('epochs',8)); dim=int(config.get('dimensions',32))
    if not 1<=epochs<=50 or not 8<=dim<=128: raise ValueError('epochs 1-50; dimensions 8-128')
    torch.manual_seed(seed); np.random.seed(seed); torch.set_num_threads(2)
    rng=np.random.default_rng(seed); started=time.perf_counter()
    df,manifest=load_dataset(dataset,data_dir,rows)
    if len(df)<30 or df.user.nunique()<3 or df.item.nunique()<3: raise ValueError('Need >=30 REAL events, >=3 users, >=3 items before training; no fake metrics')
    first=df.time.iloc[int(len(df)*0.70)]; second=df.time.iloc[int(len(df)*0.85)]
    train_df=df[df.time<first].copy()
    items=sorted(train_df.item.unique()); users=sorted(train_df.user.unique())
    im={v:i for i,v in enumerate(items)}; um={v:i for i,v in enumerate(users)}
    if len(items)<3: raise ValueError('Training split has <3 items')
    train_df['i']=train_df.item.map(im); train_df['u']=train_df.user.map(um)
    histories={int(u):g.i.tolist() for u,g in train_df.groupby('u')}
    def cases(start,end):
        found=[]; skipped=0
        for user,g in df[(df.time>=start)&(df.time<end)].groupby('user',sort=True):
            target=g.iloc[0]; past=df[(df.user==user)&(df.time<target.time)]
            history=[im[x] for x in past.item if x in im][-20:]
            if target['item'] not in im or not history: skipped+=1;continue
            found.append((um.get(user,-1),history,im[target['item']]))
        return found,skipped
    val,val_skip=cases(first,second); test,test_skip=cases(second,df.time.max()+pd.Timedelta(seconds=1))
    if not val or not test: raise ValueError('Temporal validation/test has no usable cases')
    positives={u:set(h) for u,h in histories.items()}
    utility_triples=[]
    if dataset=='kaggle_logs':
        # A 5-module catalog is nearly saturated: unseen-negative BPR is undefined for
        # most learners. Use TRAIN-only pairwise average utility preference instead.
        for user,g in train_df.groupby('u'):
            values=g.groupby('i').utility.mean().to_dict()
            utility_triples.extend((int(user),int(i),int(j)) for i in values for j in values if values[i]>values[j]+1e-9)
    pairs=np.array([(u,i) for u,seen in positives.items() if len(seen)<len(items) for i in seen],dtype=np.int64)
    if utility_triples:pairs=np.array([(u,i) for u,i,j in utility_triples],dtype=np.int64)
    # With a tiny catalog all users may have consumed all modules. Sample next-item contrasts,
    # not false "unseen" negatives; the task permits review/repeated consumption.
    contrast=False
    excluded_saturated_users=sum(len(seen)==len(items) for seen in positives.values())
    if not len(pairs): pairs=train_df[['u','i']].to_numpy(dtype=np.int64); contrast=True
    bpr=BPR(len(users),len(items),dim); optimizer=torch.optim.Adam(bpr.parameters(),lr=0.01)
    bpr_loss=[]; best_val=-1; best_state=None
    for _ in range(epochs):
        losses=[]
        for indices in np.array_split(rng.permutation(len(pairs)),max(1,math.ceil(len(pairs)/512))):
            batch=pairs[indices]; negatives=[]
            for offset,(u,i) in enumerate(batch):
                if utility_triples:
                    negatives.append(utility_triples[int(indices[offset])][2]);continue
                if contrast:
                    j=int(rng.integers(len(items)-1)); j+=j>=i
                else:
                    j=int(rng.integers(len(items)))
                    while j in positives[int(u)]: j=int(rng.integers(len(items)))
                negatives.append(j)
            optimizer.zero_grad(); loss=bpr.loss(torch.tensor(batch[:,0]),torch.tensor(batch[:,1]),torch.tensor(negatives));loss.backward();optimizer.step();losses.append(float(loss.detach()))
        bpr_loss.append(float(np.mean(losses)))
        with torch.no_grad():
            emb=bpr.items.weight.numpy(); ue=bpr.users.weight.numpy()
            value=metrics(val,lambda u,h:emb@(ue[u] if u>=0 else emb[h].mean(0)),len(items))[f'NDCG@{min(3,len(items))}']
        if value>best_val: best_val=value; best_state={k:v.detach().clone() for k,v in bpr.state_dict().items()}
    bpr.load_state_dict(best_state)
    samples=[]
    for h in histories.values():
        for index in range(1,len(h)):
            context=[i+1 for i in h[max(0,index-20):index]]
            samples.append(([0]*(20-len(context))+context,h[index]))
    if not samples: raise ValueError('Need histories of length >=2 for GRU')
    x=torch.tensor([s[0] for s in samples]); y=torch.tensor([s[1] for s in samples])
    gru=NextGRU(len(items),dim); optimizer=torch.optim.Adam(gru.parameters(),lr=0.003)
    gru_loss=[]; best_val=-1; best_state=None
    def gru_scores(u,h):
        context=[i+1 for i in h[-20:]]
        with torch.no_grad(): return gru(torch.tensor([[0]*(20-len(context))+context]))[0].numpy()
    for _ in range(epochs):
        losses=[]
        for indices in np.array_split(rng.permutation(len(samples)),max(1,math.ceil(len(samples)/256))):
            optimizer.zero_grad(); loss=nn.functional.cross_entropy(gru(x[indices]),y[indices]);loss.backward();nn.utils.clip_grad_norm_(gru.parameters(),5);optimizer.step();losses.append(float(loss.detach()))
        gru_loss.append(float(np.mean(losses)))
        gru.eval();value=metrics(val,gru_scores,len(items))[f'NDCG@{min(3,len(items))}']
        if value>best_val:best_val=value;best_state={k:v.detach().clone() for k,v in gru.state_dict().items()}
    gru.load_state_dict(best_state);gru.eval()
    emb=bpr.items.weight.detach().numpy(); ue=bpr.users.weight.detach().numpy()
    bpr_scores=lambda u,h:emb@(ue[u] if u>=0 else emb[h].mean(0))
    # External baseline: sklearn cosine NearestNeighbors fitted to training-only item-user vectors.
    unique=train_df[['u','i']].drop_duplicates()
    matrix=csr_matrix((np.ones(len(unique)),(unique.i,unique.u)),shape=(len(items),len(users)))
    neighbor=NearestNeighbors(metric='cosine',algorithm='brute',n_neighbors=min(31,len(items))).fit(matrix)
    distance,index=neighbor.kneighbors(matrix)
    similarity=np.zeros((len(items),len(items)),dtype=np.float32)
    for i in range(len(items)):
        for d,j in zip(distance[i],index[i]):
            if i!=j:similarity[i,j]=max(0,1-d)
    knn_scores=lambda u,h:similarity[h[-20:]].sum(axis=0)
    sequences=[[(int(row.i),float(row.utility)) for row in g.tail(100).itertuples()] for _,g in train_df.groupby('u')]
    mining_started=time.perf_counter()
    patterns,mining=mine_huspm(sequences,float(config.get('min_support',0.02)),float(config.get('utility_ratio',0.01)),int(config.get('max_length',3)))
    mining['runtime_seconds']=round(time.perf_counter()-mining_started,6)
    h_scores=lambda u,h:huspm_scores(h,patterns,len(items))
    weight_options=[(a,b,1-a-b) for a,b in [(0.2,0.6),(0.4,0.4),(0.6,0.2),(0.0,0.8),(0.8,0.0)]]
    def hybrid(weights):return lambda u,h:weights[0]*normalized(bpr_scores(u,h))+weights[1]*normalized(gru_scores(u,h))+weights[2]*h_scores(u,h)
    weights=max(weight_options,key=lambda w:metrics(val,hybrid(w),len(items))[f'NDCG@{min(3,len(items))}'])
    pop=train_df.i.value_counts().reindex(range(len(items)),fill_value=0).to_numpy(dtype=float)
    def without_huspm(a):return lambda u,h:a*normalized(bpr_scores(u,h))+(1-a)*normalized(gru_scores(u,h))
    no_h_weight=max([0,.25,.5,.75,1],key=lambda a:metrics(val,without_huspm(a),len(items))[f'NDCG@{min(3,len(items))}'])
    scorers={'BPR-MF':bpr_scores,'GRU-next-item':gru_scores,'Item-KNN (sklearn external)':knn_scores,'Popularity (train-only)':lambda u,h:pop,'HUSPM-only':h_scores,'BPR+GRU without HUSPM (ablation)':without_huspm(no_h_weight),'Hybrid BPR+GRU+HUSPM':hybrid(weights)}
    measured={name:{'validation':metrics(val,fn,len(items)),'test':metrics(test,fn,len(items))} for name,fn in scorers.items()}
    for values in measured.values():
        total_targets=len(test)+test_skip
        values['test_all_targets']={key:value*len(test)/total_targets for key,value in values['test'].items() if key.startswith(('Recall@','MRR@','NDCG@')) and isinstance(value,(int,float))}
        values['test_all_targets'].update({'total_target_users':total_targets,'known_catalog_with_history':len(test),'unsupported_targets_counted_as_misses':test_skip})
    manifest.update({'dataset':dataset,'version':VERSION,'code_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'dependencies':{'python':platform.python_version(),'numpy':np.__version__,'pandas':pd.__version__,'torch':torch.__version__,'sklearn':sklearn.__version__},'seed':seed,'train_rows':len(train_df),'users':len(users),'items':len(items),'train_before':first.isoformat(),'validation_before':second.isoformat(),'test_end':df.time.max().isoformat(),'validation_skipped_cold':val_skip,'test_skipped_cold':test_skip,'protocol':'global temporal 70/15/15; one first next-item target/user/split; full training catalog; repeats allowed; checkpoints and blend selected on validation only','bpr_objective':'train-only average-utility pairwise preference' if utility_triples else 'implicit observed versus unseen preference','bpr_contrast_negatives':contrast,'bpr_saturated_users':excluded_saturated_users,'bpr_training_pairs':len(pairs),'sequence_window_huspm':100,'context_window_gru':20,'utility_formula':'1 + min(time_spent_seconds,3600)/600 + quiz_score/100' if dataset=='kaggle_logs' else ('1 per click' if dataset=='kaggle_recommender' else '1 + verified_actual_seconds/600; capped at 20'),'config':config,'hybrid_weights':weights,'runtime_seconds':round(time.perf_counter()-started,3)})
    manifest['ablation_bpr_weight']=no_h_weight
    output=Path(output);output.mkdir(parents=True,exist_ok=True)
    artifact={'manifest':manifest,'metrics':measured,'mining':mining,'patterns':patterns,'items':items,'users':users,'bpr_loss':bpr_loss,'gru_loss':gru_loss,'dimensions':dim}
    torch.save({'bpr':bpr.state_dict(),'gru':gru.state_dict()},output/'models.pt')
    np.save(output/'knn.npy',similarity)
    (output/'report.json').write_text(json.dumps(artifact,ensure_ascii=False,indent=2),encoding='utf-8')
    artifact['artifact_sha256']=hashlib.sha256((output/'models.pt').read_bytes()).hexdigest()
    (output/'report.json').write_text(json.dumps(artifact,ensure_ascii=False,indent=2),encoding='utf-8')
    return artifact

def predict(artifact_dir,history,external_user=None):
    path=Path(artifact_dir);report=json.loads((path/'report.json').read_text(encoding='utf-8'))
    items=report['items'];mapping={v:i for i,v in enumerate(items)};h=[mapping[str(x)] for x in history if str(x) in mapping][-20:]
    if not h:return {'scores':[],'reason':'No mapped history; use explicit curriculum fallback, not a model claim.'}
    model=torch.load(path/'models.pt',map_location='cpu',weights_only=True)
    bpr=BPR(len(report['users']),len(items),report['dimensions']);bpr.load_state_dict(model['bpr']);bpr.eval()
    gru=NextGRU(len(items),report['dimensions']);gru.load_state_dict(model['gru']);gru.eval()
    with torch.no_grad():
        embedding=bpr.items.weight.numpy()
        u=report['users'].index(str(external_user)) if str(external_user) in report['users'] else -1
        user_vector=bpr.users.weight.numpy()[u] if u>=0 else embedding[h].mean(0)
        a=normalized(embedding@user_vector)
        context=[i+1 for i in h];b=normalized(gru(torch.tensor([[0]*(20-len(h))+context]))[0].numpy())
    c=huspm_scores(h,report['patterns'],len(items));w=report['manifest']['hybrid_weights'];scores=w[0]*a+w[1]*b+w[2]*c
    return {'scores':[{'item':items[i],'score':float(scores[i]),'bpr':float(a[i]),'gru':float(b[i]),'huspm':float(c[i])} for i in np.argsort(-scores)],'reason':'Hybrid; BPR fold-in for unknown users; only approved mappings are used','manifest':report['manifest'],'model_sha256':report['artifact_sha256']}

if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument('--dataset',choices=list(SOURCES),required=True);parser.add_argument('--data',default='data');parser.add_argument('--output',required=True);parser.add_argument('--epochs',type=int,default=8)
    args=parser.parse_args();result=train(args.dataset,args.data,args.output,{'epochs':args.epochs});print(json.dumps({'manifest':result['manifest'],'metrics':result['metrics'],'patterns':len(result['patterns'])},ensure_ascii=False,indent=2))
