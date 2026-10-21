import assert from 'node:assert/strict';
import { readFileSync,writeFileSync,mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const base=process.env.VEDU_BASE_URL || 'http://localhost:8080',stamp=Date.now(),sessions=[],checks=[];
const env=Object.fromEntries(readFileSync(new URL('../.env',import.meta.url),'utf8').split(/\r?\n/).filter(x=>x && !x.startsWith('#')).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),x.slice(i+1)];}));
const markTest=id=>execFileSync('docker',['compose','exec','-T','db','psql','-U',env.POSTGRES_USER,'-d',env.POSTGRES_DB,'-c',`UPDATE auth.users SET is_test_account=true WHERE user_id=${Number(id)}`],{encoding:'utf8'});
async function call(path,auth,data,method) {const r=await fetch(base+'/api'+path,{method:method || (data?'POST':'GET'),headers:{'Content-Type':'application/json',...(auth?{Authorization:`Bearer ${auth.accessToken}`}:{})},...(data?{body:JSON.stringify(data)}:{})});return {status:r.status,body:await r.json().catch(()=>null)};}
async function ok(...args){const r=await call(...args);assert.ok(r.status>=200 && r.status<300,JSON.stringify({path:args[0],...r}));return r.body;}
function check(label,condition){assert.ok(condition,label);checks.push(label);console.log('PASS',label);}
async function login(username,password,expectedRole){const auth=await ok('/auth/login',null,{username,password,expectedRole});sessions.push(auth);return auth;}
let assignedCourse,staff,admin;
try {
 admin=await login('admin','Demo@123','ADMIN');
 const catalog=await ok('/courses');const course=catalog.find(c=>c.title==='Office 365 — Nội dung tham chiếu Kaggle');assert.ok(course,'Run prepare-reference-course.py first');assignedCourse=course.id;
 const staffUser=await ok('/users',admin,{username:`verify_teacher_${stamp}`,password:'Verify@123',fullName:'Giảng viên kiểm tra',email:`verify_teacher_${stamp}@example.test`,phone:'0901234567',role:'TEACHER'});markTest(staffUser.userId);
 staff=await login(`verify_teacher_${stamp}`,'Verify@123','TEACHER');
 check('unassigned teacher cannot read course content',(await call(`/platform/courses/${course.id}/content`,staff)).status===403);
 await ok(`/platform/courses/${course.id}/teachers/${staffUser.userId}`,admin,{});
 check('assigned teacher can read scoped content',(await ok(`/platform/courses/${course.id}/content`,staff)).lessons.length===10);
 check('teacher overview includes assigned course',(await ok('/portal/overview',staff)).courses.some(c=>Number(c.courseId)===course.id));
 await ok(`/platform/courses/${course.id}/teachers/${staffUser.userId}`,admin,{},'DELETE');
 check('assignment removal immediately removes course access',(await call(`/platform/courses/${course.id}/content`,staff)).status===403);
 const registration=await ok('/auth/register',null,{username:`verify_ml_${stamp}`,fullName:'Học viên kiểm tra ML',email:`verify_ml_${stamp}@example.test`,phone:'0901234567',password:'Verify@123',confirmPassword:'Verify@123'});markTest(registration.user.userId);
 const student=await login(`verify_ml_${stamp}`,'Verify@123','STUDENT');
 await ok(`/enrollments/me/${course.id}`,student,{});
 const classroom=await ok(`/platform/courses/${course.id}/classroom`,student);
 check('automatic classroom recommendation is honest cold-start',classroom.recommendations.source==='FALLBACK');
 const lesson=classroom.sections.flatMap(s=>s.lessons)[0];
 await ok('/learning/events',student,{eventUuid:crypto.randomUUID(),learningSessionId:crypto.randomUUID(),courseId:course.id,lessonId:lesson.id,action:'COMPLETE_LESSON',durationSeconds:0});
 const inferred=await ok(`/platform/courses/${course.id}/recommendations`,student,{});
 check('approved same-content mapping invokes trained model',inferred.source==='MODEL' && inferred.recommendations.length>0 && !!inferred.experimentId);
 check('inference exposes BPR and GRU components',inferred.recommendations.every(r=>Number.isFinite(r.components.bpr) && Number.isFinite(r.components.gru)));
 const id=inferred.recommendations[0].recommendation_id;
 await ok(`/portal/student/recommendations/${id}/feedback`,student,{action:'ACCEPTED'});
 check('model feedback persisted',(await ok('/portal/overview',student)).recommendations.every(r=>String(r.recommendationId)!==String(id)));
 const reopened=await ok(`/platform/courses/${course.id}/classroom`,student);
 check('classroom automatically refreshes model recommendations',reopened.recommendations.source==='MODEL');
 mkdirSync(new URL('../docs/validation/',import.meta.url),{recursive:true});writeFileSync(new URL('../docs/validation/role-ml-checks.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),checks,experimentId:inferred.experimentId,scope:'Functional integration with same-content Kaggle mapping, NOT VEDU learning-outcome evaluation'},null,2));
} finally {
 if(admin && staff && assignedCourse) await call(`/platform/courses/${assignedCourse}/teachers/${staff.user.userId}`,admin,{},'DELETE').catch(()=>{});
 for(const auth of sessions)await call('/auth/revoke',null,{refreshToken:auth.refreshToken}).catch(()=>{});
}
