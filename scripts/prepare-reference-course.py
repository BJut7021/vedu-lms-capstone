"""Create an attributable reference-content course with EXACT Kaggle item mappings.
No fake learners, scores or interactions. Does not claim this is a new authored curriculum.
Run after Kaggle benchmark training; source license must be reviewed before public distribution.
"""
import csv
import json
import os
import urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('VEDU_BASE_URL','http://localhost:8080')
def request(path,auth=None,body=None,method=None):
    data=None if body is None else json.dumps(body).encode()
    req=urllib.request.Request(BASE+'/api'+path,data=data,method=method or ('POST' if data is not None else 'GET'),headers={'Content-Type':'application/json',**({'Authorization':'Bearer '+auth['accessToken']} if auth else {})})
    with urllib.request.urlopen(req,timeout=65) as response:return json.load(response)
teacher=request('/auth/login',body={'username':os.environ.get('VEDU_TEACHER_USERNAME','teacher'),'password':os.environ.get('VEDU_TEACHER_PASSWORD','Demo@123'),'expectedRole':'TEACHER'})
admin=request('/auth/login',body={'username':os.environ.get('VEDU_ADMIN_USERNAME','admin'),'password':os.environ.get('VEDU_ADMIN_PASSWORD','Demo@123'),'expectedRole':'ADMIN'})
try:
    title='Office 365 — Nội dung tham chiếu Kaggle'
    owned=request('/portal/overview',teacher)['courses']
    course=next((c for c in owned if c['courseName']==title),None)
    if course:print('Reference course already exists:',course['courseId']);raise SystemExit(0)
    with (ROOT/'ml-core/data/implicit_ratings_en.csv').open(encoding='utf-8') as f:interactions=list(csv.DictReader(f))
    interactions.sort(key=lambda r:r['created_at']);known={r['item_id'] for r in interactions[:int(len(interactions)*.7)]}
    with (ROOT/'ml-core/data/items_en.csv').open(encoding='utf-8') as f:items=[r for r in csv.DictReader(f) if r['item_id'] in known][:10]
    course=request('/portal/teacher/courses',teacher,{'name':title,'description':'Nội dung tham chiếu từ items_en.csv của bộ E-learning Recommender System Dataset do nhóm cung cấp. Dùng trình diễn mapping cùng miền nội dung; không phải bằng chứng hiệu quả trên VEDU. Nội dung lịch sử Office 365 có thể đã thay đổi.','topic':'Kỹ năng số','price':0})
    course_id=course['courseId']
    section=request(f'/platform/courses/{course_id}/sections',teacher,{'title':'Nội dung Office 365 gốc'})
    for item in items:
        duration=int(float(item['duration'] or 0))
        content=(item['description'] or '')+'\n\nNguồn: https://www.kaggle.com/datasets/nhondangcode/e-learning-recommender-system-dataset\nItem ID: '+item['item_id']+'\nĐây là mô tả nội dung gốc để thử nghiệm chuyển miền; không thay thế tài liệu giảng dạy đã được thẩm định.'
        lesson=request(f'/portal/teacher/courses/{course_id}/lessons',teacher,{'title':item['name'][:220],'content':content,'durationSeconds':duration})
        request(f'/platform/lessons/{lesson["lessonId"]}',teacher,{'title':item['name'][:220],'content':content,'durationSeconds':duration,'isPublished':True,'sectionId':section['section_id']},'PATCH')
        request('/platform/ml/mappings',admin,{'dataset':'kaggle_recommender','externalItemId':item['item_id'],'lessonId':lesson['lessonId']})
    request(f'/portal/teacher/courses/{course_id}/status',teacher,{'status':'PUBLISHED'},'PATCH')
    print('Reference course ready:',course_id,'with',len(items),'source-preserving mappings. No interactions were generated.')
finally:
    for auth in [teacher,admin]:
        try:request('/auth/revoke',body={'refreshToken':auth['refreshToken']})
        except Exception:pass
