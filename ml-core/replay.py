"""Read-only research replay. No VEDU user creation, events or fake evaluation metrics."""
import hashlib
import json
from pathlib import Path
from engine import load_dataset, predict

def replay(artifact_dir, data_dir):
    path = Path(artifact_dir)
    report = json.loads((path/'report.json').read_text(encoding='utf-8'))
    dataset = report['manifest']['dataset']
    if dataset not in ('kaggle_logs','kaggle_recommender'):
        raise ValueError('Replay only supports external public datasets, never private VEDU histories')
    df, provenance = load_dataset(dataset, data_dir)
    if provenance['hashes'] != report['manifest']['hashes']:
        raise ValueError('Dataset hash changed since training; import the correct version')
    cutoff = report['manifest']['validation_before']
    catalog = set(report['items'])
    samples = []
    for user, group in df[df.time >= cutoff].groupby('user', sort=True):
        target = group.iloc[0]
        past = df[(df.user == user) & (df.time < target.time)]
        history = [x for x in past.item if x in catalog][-20:]
        if not history or target['item'] not in catalog:
            continue
        result = predict(path, history, user)
        top = result['scores'][:5]
        samples.append({'sample': hashlib.sha256((dataset+user).encode()).hexdigest()[:12],
            'history': history, 'target': target['item'], 'targetTime':target.time.isoformat(),
            'top5':top,'hit3':target['item'] in [x['item'] for x in top[:3]]})
        if len(samples)==5:break
    return {'dataset':dataset,'source':provenance['source'],'hashes':provenance['hashes'],
        'scope':'First 5 eligible test histories (NOT a random/representative sample). Replay, not a new quality benchmark. Not imported into VEDU REAL events.',
        'samples':samples,'storedAsLearners':False}
