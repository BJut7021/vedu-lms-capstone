import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,existsSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
const require=createRequire(new URL('../backend/package.json',import.meta.url));
require('reflect-metadata');
const {DataSource}=require('typeorm'),bcrypt=require('bcryptjs');
const {PlatformService}=await import('../backend/dist/platform/platform.service.js');
const env=Object.fromEntries(readFileSync('.env','utf8').split(/\r?\n/).filter(x=>x&&!x.startsWith('#')).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),x.slice(i+1)];}));
const db=new DataSource({type:'postgres',host:'127.0.0.1',port:5432,username:env.POSTGRES_USER,password:env.POSTGRES_PASSWORD,database:env.POSTGRES_DB});
await db.initialize();const checks=[];const check=(s,v)=>{assert.ok(v,s);checks.push(s);console.log('PASS',s);};
let fixture,users=[];
try{
 const courses=await db.query('SELECT c.*,k.course_key FROM lms.courses c JOIN lms.curated_courses k USING(course_id) WHERE NOT c.is_deleted');
 check('Exactly 21 active curated courses',courses.length===21);
 check('Five office/digital courses',courses.filter(c=>['word','excel','powerpoint','digital','digital-literacy'].includes(c.course_key)).length===5);
 const before=await db.query('SELECT (SELECT count(*) FROM lms.lessons) lessons,(SELECT count(*) FROM assessment.quizzes) quizzes,(SELECT count(*) FROM learning.lesson_progress) progress');
 await db.query(readFileSync('database/vedu/curated_catalog.sql','utf8'));
 const after=await db.query('SELECT (SELECT count(*) FROM lms.lessons) lessons,(SELECT count(*) FROM assessment.quizzes) quizzes,(SELECT count(*) FROM learning.lesson_progress) progress');
 check('SQL replay preserves lessons, quizzes and progress',JSON.stringify(before)===JSON.stringify(after));
 for(const c of courses){
  const [stats]=await db.query('SELECT (SELECT count(*)::int FROM lms.lessons WHERE course_id=$1 AND is_published AND NOT is_deleted) lessons,(SELECT count(*)::int FROM assessment.quizzes WHERE course_id=$1 AND is_published AND NOT is_deleted) quizzes',[c.course_id]);
  check(`${c.course_key}: lessons and exactly one final quiz`,stats.lessons>=6&&stats.quizzes===1);
  const qs=await db.query('SELECT x.question_id,count(*)::int choices,count(*) FILTER(WHERE a.is_correct)::int correct FROM assessment.quizzes q JOIN assessment.questions x USING(quiz_id) JOIN assessment.answers a USING(question_id) WHERE q.course_id=$1 AND q.is_published AND NOT q.is_deleted GROUP BY x.question_id',[c.course_id]);
  check(`${c.course_key}: valid final-question answers`,qs.length>=6&&qs.every(x=>x.choices>=2&&x.correct===1));
 }
 const pdfs=await db.query("SELECT DISTINCT r.resource_url FROM lms.lesson_resources r JOIN lms.lessons l USING(lesson_id) JOIN lms.courses c USING(course_id) WHERE NOT c.is_deleted AND l.is_published AND NOT l.is_deleted AND r.resource_url LIKE 'vedu-file:%'");
 check('All active protected PDF resources exist locally',pdfs.every(r=>existsSync('backend/media/'+r.resource_url.slice(10))));
 const teachers=await db.query("SELECT user_id,username,password_hash FROM auth.users WHERE username IN ('gv.minhan','gv.thanhha','gv.quanghuy','gv.ngocmai') AND role='TEACHER' AND is_active AND is_test_account");
 check('Four fictional teachers with working test password',teachers.length===4&&teachers.every(t=>bcrypt.compareSync('VeduTest@2026',t.password_hash)));
 for(const t of teachers){const rows=await db.query('SELECT 1 FROM lms.course_teachers ct JOIN lms.courses c USING(course_id) WHERE ct.teacher_id=$1 AND NOT c.is_deleted',[t.user_id]);check(`${t.username}: assigned courses visible`,rows.length>0);}
 for(let i=0;i<2;i++){const [u]=await db.query("INSERT INTO auth.users(full_name,username,email,password_hash,role,is_test_account) VALUES('Kiểm thử ticket',$1,$2,$3,'STUDENT',true) RETURNING user_id",['ct_'+randomUUID().slice(0,10),randomUUID()+'@example.invalid',bcrypt.hashSync(randomUUID(),10)]);users.push(Number(u.user_id));}
 const [admin]=await db.query("SELECT user_id FROM auth.users WHERE role='ADMIN' AND is_active ORDER BY user_id LIMIT 1");
 const student={userId:users[0],role:'STUDENT'},other={userId:users[1],role:'STUDENT'},staff={userId:Number(teachers[0].user_id),role:'TEACHER'},owner={userId:Number(admin.user_id),role:'ADMIN'};
 [fixture]=await db.query("INSERT INTO support.tickets(student_id,subject,assigned_to) VALUES($1,'[TEST] closed ticket',$2) RETURNING ticket_id",[student.userId,staff.userId]);
 const service=new PlatformService(db,null,null,null,null);
 await service.updateTicket(student,fixture.ticket_id,{message:'Nội dung kiểm thử'});
 await service.updateTicket(owner,fixture.ticket_id,{status:'CLOSED',message:'Đã hoàn tất kiểm tra'});
 check('Admin can close with a final note',(await service.ticket(student,fixture.ticket_id)).status==='CLOSED');
 await assert.rejects(service.updateTicket(student,fixture.ticket_id,{message:'Tin nhắn sau đóng'}),e=>e.getStatus()===400);check('Student cannot message a closed ticket',true);
 await assert.rejects(service.updateTicket(student,fixture.ticket_id,{status:'OPEN'}),e=>e.getStatus()===403);check('Student cannot reopen a closed ticket',true);
 await assert.rejects(service.updateTicket(staff,fixture.ticket_id,{status:'OPEN'}),e=>e.getStatus()===403);check('Assigned teacher cannot reopen admin-closed ticket',true);
 await assert.rejects(service.ticket(other,fixture.ticket_id),e=>e.getStatus()===403);check('Another student cannot read ticket',true);
 check('Closed-ticket history remains readable',(await service.ticket(student,fixture.ticket_id)).messages.length===2);
 await service.updateTicket(owner,fixture.ticket_id,{status:'OPEN'});await service.updateTicket(student,fixture.ticket_id,{message:'Phản hồi sau khi admin mở lại'});check('Only admin reopening permits new messages',true);
 writeFileSync('docs/validation/curated-catalog-checks.json',JSON.stringify({checkedAt:new Date().toISOString(),checks},null,2));
 console.log('Checks:',checks.length);
}finally{
 if(fixture)await db.query('DELETE FROM support.tickets WHERE ticket_id=$1',[fixture.ticket_id]);
 for(const u of users)await db.query('DELETE FROM auth.users WHERE user_id=$1',[u]);
 await db.destroy();
}
