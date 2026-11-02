"""Create a small source-only upload and notebook; no credentials or student data."""
import hashlib
import json
import subprocess
import zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'.work'/'research-kaggle'
OUT.mkdir(parents=True,exist_ok=True)
files=[ROOT/'ml-core'/x for x in ['engine.py','benchmark.py','requirements.txt']]
lock={'base_commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
      'source_sha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in files},
      'dataset_sha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((ROOT/'ml-core'/'data').glob('*.csv'))}}
(OUT/'research-lock.json').write_text(json.dumps(lock,indent=2),encoding='utf-8')
with zipfile.ZipFile(OUT/'vedu-research-source.zip','w',zipfile.ZIP_DEFLATED) as z:
    for p in files:z.write(p,p.name)
    z.write(OUT/'research-lock.json','research-lock.json')
def cell(kind,text):
    value={'cell_type':kind,'metadata':{},'source':text.splitlines(keepends=True)}
    if kind=='code':value.update(execution_count=None,outputs=[])
    return value
cells=[cell('markdown','# VEDU reproducible recommendation experiment\nAdd both Kaggle datasets and a private dataset containing vedu-research-source.zip. CPU is sufficient. Save Version / Run All to retain executed outputs. No private VEDU learner data is uploaded.\n'),
cell('code', '''from pathlib import Path
import zipfile, shutil, hashlib, json, sys
WORK=Path('/kaggle/working/vedu-research')
WORK.mkdir(exist_ok=True)
archives=list(Path('/kaggle/input').rglob('vedu-research-source.zip'))
assert len(archives)==1, 'Add the source ZIP as an input dataset'
with zipfile.ZipFile(archives[0]) as z:
    allowed={'engine.py','benchmark.py','requirements.txt','research-lock.json'}
    assert set(z.namelist())==allowed
    z.extractall(WORK)
lock=json.loads((WORK/'research-lock.json').read_text())
for name,digest in lock['source_sha256'].items():
    assert hashlib.sha256((WORK/name).read_bytes()).hexdigest()==digest
DATA=WORK/'data'; DATA.mkdir(exist_ok=True)
for name,digest in lock['dataset_sha256'].items():
    matches=list(Path('/kaggle/input').rglob(name))
    assert len(matches)==1, (name, matches)
    shutil.copy2(matches[0],DATA/name)
    assert hashlib.sha256((DATA/name).read_bytes()).hexdigest()==digest, 'Dataset version differs: '+name
print('Source revision',lock['base_commit']); print(lock['dataset_sha256'])
'''),cell('code', '''import subprocess
subprocess.run([sys.executable,'-m','pip','install','-r',str(WORK/'requirements.txt')],check=True)
subprocess.run([sys.executable,str(WORK/'benchmark.py'),'--data',str(DATA),'--output','/kaggle/working/results','--epochs','20','--environment','kaggle'],check=True)
'''),cell('code', '''import pandas as pd
results=pd.read_csv('/kaggle/working/results/model-results.csv')
assert len(results)==160
display(results.groupby(['dataset','protocol','model'])[['Recall@3','NDCG@3','all_NDCG@3']].agg(['mean','std']))
shutil.make_archive('/kaggle/working/vedu-kaggle-results','zip','/kaggle/working/results')
print('Download vedu-kaggle-results.zip and Save Version with executed outputs.')
''')]
# Embed the reviewed source so Kaggle needs only the two public dataset inputs.
payload={p.name:p.read_text(encoding='utf-8') for p in files}
payload['research-lock.json']=json.dumps(lock)
setup="from pathlib import Path\nimport shutil, hashlib, json, sys\nWORK=Path('/kaggle/working/vedu-research')\nWORK.mkdir(exist_ok=True)\n"
setup+='SOURCE_FILES='+repr(payload)+'\nfor name,content in SOURCE_FILES.items():\n    (WORK/name).write_text(content,encoding="utf-8")\n'
# Embedded text normalizes CRLF to LF; the hash must describe the executed bytes.
embedded_lock=dict(lock)
embedded_lock['source_sha256']={p.name:hashlib.sha256(payload[p.name].encode()).hexdigest() for p in files}
payload['research-lock.json']=json.dumps(embedded_lock)
setup=setup[:setup.index('SOURCE_FILES=')]+'SOURCE_FILES='+repr(payload)+'\nfor name,content in SOURCE_FILES.items():\n    (WORK/name).write_text(content,encoding="utf-8")\n'
tail=''.join(cells[1]['source']).split("lock=json.loads",1)[1]
cells[1]=cell('code',setup+'lock=json.loads'+tail)
cells[0]=cell('markdown','# VEDU reproducible recommendation experiment\nAdd the two public Kaggle datasets. Source is embedded and checked by SHA256. CPU is sufficient. Save Version / Run All to retain executed outputs.\n')
notebook={'cells':cells,'metadata':{'kernelspec':{'display_name':'Python 3','language':'python','name':'python3'},'language_info':{'name':'python','version':'3.11'}},'nbformat':4,'nbformat_minor':5}
(OUT/'VEDU_Research_5Seeds_2Protocols.ipynb').write_text(json.dumps(notebook,ensure_ascii=False,indent=2),encoding='utf-8')
print(OUT)
