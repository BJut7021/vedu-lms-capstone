"""Internal authenticated CPU worker. One job at a time; persistent artifacts, no pickle input."""
import json
import os
import threading
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from engine import predict, train
from replay import replay

ROOT=Path(os.environ.get('ML_ARTIFACT_DIR','artifacts'));ROOT.mkdir(parents=True,exist_ok=True)
SECRET=os.environ.get('ML_INTERNAL_TOKEN','local-vedu-ml-change-me')
LOCK=threading.Lock()
for previous in ROOT.glob('*/job.json'):
    value=json.loads(previous.read_text(encoding='utf-8'))
    if value.get('status')=='RUNNING':
        value.update(status='FAILED',error='Worker restarted before training finished. Submit a new experiment; partial artifacts are not activated.')
        previous.write_text(json.dumps(value),encoding='utf-8')
def job_file(job):return ROOT/job/'job.json'
def write_job(job,value):job_file(job).write_text(json.dumps(value,ensure_ascii=False,indent=2),encoding='utf-8')
class Handler(BaseHTTPRequestHandler):
    def log_message(self,*args):pass  # Do not log tokens or raw learner histories.
    def send(self,status,body):
        encoded=json.dumps(body,ensure_ascii=False).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(encoded)));self.end_headers();self.wfile.write(encoded)
    def do_GET(self):
        if self.headers.get('X-ML-Token')!=SECRET:return self.send(401,{'message':'Unauthorized'})
        if self.path=='/health':return self.send(200,{'status':'ok'})
        job=self.path.removeprefix('/jobs/')
        try:
            uuid.UUID(job);value=json.loads(job_file(job).read_text(encoding='utf-8'))
            if value['status']=='SUCCEEDED':value['report']=json.loads((ROOT/job/'report.json').read_text(encoding='utf-8'))
            return self.send(200,value)
        except (ValueError,FileNotFoundError):return self.send(404,{'message':'Job not found'})
    def do_POST(self):
        if self.headers.get('X-ML-Token')!=SECRET:return self.send(401,{'message':'Unauthorized'})
        size=int(self.headers.get('Content-Length',0))
        if size>20_000_000:return self.send(413,{'message':'Dataset too large'})
        try:
            body=json.loads(self.rfile.read(size))
            if self.path=='/replay':
                uuid.UUID(body['jobId']);return self.send(200,replay(ROOT/body['jobId'],os.environ.get('ML_DATA_DIR','data')))
            if self.path=='/predict':
                uuid.UUID(body['jobId']);return self.send(200,predict(ROOT/body['jobId'],body.get('history',[]),body.get('user')))
            if self.path!='/train':return self.send(404,{'message':'Not found'})
            if not LOCK.acquire(blocking=False):return self.send(409,{'message':'Another training job is running'})
            job=str(uuid.uuid4());(ROOT/job).mkdir();write_job(job,{'jobId':job,'status':'RUNNING','dataset':body['dataset']})
            def run():
                try:
                    train(body['dataset'],os.environ.get('ML_DATA_DIR','data'),ROOT/job,body.get('config'),body.get('rows'));write_job(job,{'jobId':job,'status':'SUCCEEDED','dataset':body['dataset']})
                except Exception as error:write_job(job,{'jobId':job,'status':'FAILED','dataset':body['dataset'],'error':str(error)})
                finally:LOCK.release()
            threading.Thread(target=run,daemon=True).start();return self.send(202,{'jobId':job,'status':'RUNNING'})
        except Exception as error:return self.send(400,{'message':str(error)})
if __name__=='__main__':
    ThreadingHTTPServer((os.environ.get('ML_BIND','127.0.0.1'),int(os.environ.get('ML_PORT',8001))),Handler).serve_forever()
