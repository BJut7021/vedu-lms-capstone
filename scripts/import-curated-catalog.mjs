import {readFileSync,writeFileSync,mkdirSync,copyFileSync,existsSync,readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
const require=createRequire(new URL('../backend/package.json',import.meta.url)),{Client}=require('pg'),bcrypt=require('bcryptjs');
const env=Object.fromEntries(readFileSync('.env','utf8').split(/\r?\n/).filter(x=>x&&!x.startsWith('#')).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),x.slice(i+1)];}));
const db=new Client({host:'127.0.0.1',port:Number(process.env.DB_PORT||5432),user:env.POSTGRES_USER,database:env.POSTGRES_DB,password:env.POSTGRES_PASSWORD});
await db.connect();
const raw=JSON.parse(readFileSync('data/learning/curated-catalog.json','utf8'));
const courses=[];
const esc=x=>String(x).replace(/'/g,"''");
const html=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const oldSoftware=JSON.parse(readFileSync('data/learning/software-curriculum.json','utf8')).courses;
for(const c of raw.courses){
 const marker=c.existingMarker||`[VEDU-CURATED-v202611:${c.key}]`;
 const workbook={title:'Sổ tự học, đề cương và bài tập tham khảo - bản 2026.11',type:'PDF',url:`vedu-file:${c.workbook.file}`};
 const fileResource=f=>({title:f.name,type:extname(f.file)==='.pdf'?'PDF':extname(f.file)==='.pptx'?'SLIDE':'SPREADSHEET',url:extname(f.file)==='.pdf'?`vedu-file:${f.file}`:`/course-materials/batch-assets/${f.file}`});
 const intro=`HƯỚNG DẪN BẮT ĐẦU\n${c.summary}\n\nCHUẨN BỊ\n${c.preparation}\n\nCÁCH HỌC\nĐọc đề cương và sổ tự học, học tuần tự ${c.lessons.length} bài, đọc tài liệu gốc, làm bài tập và lưu sản phẩm. Video tham khảo mở tại nguồn, không dùng để tính thời gian xem trong VEDU.\n\nĐÁNH GIÁ\nHoàn thành tất cả bài học; đạt bài kiểm tra kiến thức cuối khóa từ 7/10, tối đa 3 lượt. Bài thực hành và đề tự luận dùng để luyện tập, chưa tự chấm sản phẩm. Chứng nhận VEDU là chứng nhận hoàn thành khóa tự học, không phải chứng chỉ MOS hoặc chứng chỉ của đơn vị nguồn.\n\nĐỀ CƯƠNG\n${c.lessons.map((l,i)=>`${i+1}. ${l.title}`).join('\n')}\n\nNGUỒN\n${c.archive||'Tài liệu gốc và tham khảo trong sổ tự học.'}\n${c.references.map(r=>r.title+' '+r.url).join('\n')}\nChưa có xác nhận thẩm định độc lập của giảng viên.`;
 const lessons=[{title:'00 · Hướng dẫn bắt đầu & đề cương',content:intro,seconds:300,resources:[workbook,...c.files.map(fileResource)]},...c.lessons.map((l,i)=>({title:`${String(i+1).padStart(2,'0')} · ${l.title}`,content:l.content,seconds:l.seconds||1200,resources:[workbook,...(l.files.length?l.files:c.files.filter(f=>extname(f.file)==='.pdf'&&!/test|ki[eể]m tra/i.test(f.name))).map(fileResource),...(l.links||[]).filter(r=>/^https:\/\//.test(r.url||'')).map(r=>({title:r.title,type:'LINK',url:r.url}))]}))];
 // Keep answer keys in database only; no teacher-only file is copied to public assets.
 let questions=c.questions;
 if(c.legacyWorkbookOnly){const {softwareAssessments}=await import('../data/learning/software-assessments.mjs');questions=softwareAssessments[c.key].map(q=>({text:q.text,options:q.options,correct:0}));}
 for(const [i,l] of lessons.entries()){
  const publicRoot=resolve('frontend/public/course-materials',c.key);mkdirSync(publicRoot,{recursive:true});
  const filename=`${String(i).padStart(2,'0')}.html`;
  writeFileSync(resolve(publicRoot,filename),`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${html(l.title)}</title><style>body{font:17px/1.75 system-ui;color:#17243e;background:#f1f5f9}main{max-width:920px;margin:24px auto;background:white;padding:32px;border-radius:20px}h1{font-size:28px;line-height:1.35}p{white-space:pre-line;overflow-wrap:anywhere}</style><main><small>VEDU · Tự học và thực hành</small><h1>${html(l.title)}</h1><p>${html(l.content)}</p></main></html>`);
  l.resources.unshift({title:i?'Phiếu thực hành tiếng Việt':'Hướng dẫn và chuẩn đầu ra',type:'LINK',url:`/course-materials/${c.key}/${filename}`});
 }
 courses.push({key:c.key,name:c.name,topic:c.topic,marker,summary:c.summary,preparation:c.preparation,lessons,questions});
}
// Preserve the two already authored computing courses, including original sources and quiz questions.
for(const key of ['discrete','networks']){
 const {rows:[c]}=await db.query('SELECT * FROM lms.courses WHERE description LIKE $1',[`[VEDU-COMPUTING-v1:${key}]%`]);
 if(!c) throw Error(`Existing course missing: ${key}`);
 const {rows:ls}=await db.query('SELECT * FROM lms.lessons WHERE course_id=$1 AND NOT is_deleted AND is_published ORDER BY lesson_order',[c.course_id]);
 const lessons=[];
 for(const l of ls){const {rows:rs}=await db.query('SELECT title,resource_type AS type,resource_url AS url FROM lms.lesson_resources WHERE lesson_id=$1 ORDER BY display_order',[l.lesson_id]);lessons.push({title:l.title,content:l.content,seconds:l.estimated_duration_seconds||900,resources:rs});}
 const {rows:qs}=await db.query('SELECT q.question_id,q.question_text AS text FROM assessment.questions q JOIN assessment.quizzes z USING(quiz_id) WHERE z.course_id=$1 AND z.is_published AND NOT z.is_deleted ORDER BY q.question_order',[c.course_id]);
 const questions=[];for(const q of qs){const {rows:a}=await db.query('SELECT answer_text,is_correct FROM assessment.answers WHERE question_id=$1 ORDER BY answer_order',[q.question_id]);questions.push({text:q.text,options:a.map(x=>x.answer_text),correct:a.findIndex(x=>x.is_correct)});}
 courses.push({key,name:c.course_name,topic:c.topic,marker:`[VEDU-COMPUTING-v1:${key}]`,summary:c.description.split('\n').slice(1).join('\n'),preparation:'Kiến thức nền tảng theo hướng dẫn đầu khóa.',lessons,questions});
}
if(courses.length!==21)throw Error('Expected 21 courses');
for(const c of courses){if(!c.lessons.length||c.questions.length<6)throw Error(`Incomplete ${c.key}`);for(const q of c.questions)if(q.correct<0||q.correct>=q.options.length||new Set(q.options).size!==q.options.length)throw Error(`Invalid question ${c.key}`);}
const teachers=[['gv.minhan','Nguyễn Minh An'],['gv.thanhha','Trần Thanh Hà'],['gv.quanghuy','Lê Quang Huy'],['gv.ngocmai','Phạm Ngọc Mai']].map(([username,name])=>({username,name,hash:bcrypt.hashSync('VeduTest@2026',10)}));
const data=JSON.stringify(courses),people=JSON.stringify(teachers);
const sql=`-- VEDU curated catalog 2026.11.2. Originals and AI-assisted workbooks have distinct provenance.
-- Repeatable, one-time per revision. Retired courses are soft-deleted; learner history is retained.
BEGIN;
CREATE TABLE IF NOT EXISTS lms.catalog_revisions(revision text PRIMARY KEY,applied_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS lms.curated_courses(course_key text PRIMARY KEY,course_id bigint UNIQUE REFERENCES lms.courses,revision text NOT NULL);
CREATE TABLE IF NOT EXISTS lms.catalog_retirements(course_id bigint PRIMARY KEY REFERENCES lms.courses,previous_teacher_id bigint,previous_status text,retired_at timestamptz DEFAULT now());
DO $curated$
DECLARE c jsonb; l jsonb; r jsonb; q jsonb; a jsonb; t jsonb; cid bigint; lid bigint; qid bigint; rid bigint; sid bigint; tid bigint; adminid bigint; n int; pos int; ai int; rotation int; selected bigint[]='{}'; used bigint[]; prev bigint; teacherids bigint[]='{}'; idx int=0;
BEGIN
PERFORM pg_advisory_xact_lock(hashtext('vedu-curated-2026.11'));
IF EXISTS(SELECT 1 FROM lms.catalog_revisions WHERE revision='2026.11.2') THEN RETURN; END IF;
SELECT user_id INTO adminid FROM auth.users WHERE role='ADMIN' ORDER BY user_id LIMIT 1;
FOR t IN SELECT value FROM jsonb_array_elements('${esc(people)}'::jsonb) LOOP
 INSERT INTO auth.users(full_name,username,email,password_hash,role,is_active,is_test_account)
 VALUES(t->>'name',t->>'username',(t->>'username')||'@vedu.local',t->>'hash','TEACHER',true,true) ON CONFLICT DO NOTHING;
 SELECT user_id INTO tid FROM auth.users WHERE username=t->>'username' AND role='TEACHER';
 IF tid IS NULL THEN RAISE EXCEPTION 'Instructor username conflict'; END IF;
 teacherids=array_append(teacherids,tid);
END LOOP;
FOR c IN SELECT value FROM jsonb_array_elements('${esc(data)}'::jsonb) LOOP
 idx=idx+1; tid=teacherids[1+((idx-1)%4)];
 SELECT course_id,teacher_id INTO cid,prev FROM lms.courses WHERE description LIKE (c->>'marker')||'%' ORDER BY course_id LIMIT 1;
 IF cid IS NULL THEN
  INSERT INTO lms.courses(course_name,description,teacher_id,price,status,topic) VALUES(c->>'name',(c->>'marker')||E'\n'||(c->>'summary'),tid,0,'DRAFT',c->>'topic') RETURNING course_id INTO cid;
 END IF;
 UPDATE lms.courses SET course_name=c->>'name',description=(c->>'marker')||E'\n'||(c->>'summary'),topic=c->>'topic',status='PUBLISHED',is_deleted=false,deleted_at=NULL,review_status='APPROVED',review_note='Học liệu gốc theo gói nhóm cung cấp; nội dung bổ sung chưa thẩm định độc lập. Chứng nhận hoàn thành VEDU.' WHERE course_id=cid;
 INSERT INTO lms.course_teachers(course_id,teacher_id,assigned_by) VALUES(cid,tid,adminid) ON CONFLICT DO NOTHING;
 INSERT INTO auth.notifications(user_id,title,body,route) VALUES(tid,'Khóa học được phân công',(c->>'name')||' — Tài khoản giảng viên kiểm thử hư cấu.','/teacher/content');
 INSERT INTO lms.curated_courses VALUES(c->>'key',cid,'2026.11') ON CONFLICT(course_key) DO UPDATE SET course_id=EXCLUDED.course_id,revision=EXCLUDED.revision;
 selected=array_append(selected,cid);
 SELECT section_id INTO sid FROM lms.course_sections WHERE course_id=cid ORDER BY section_order LIMIT 1;
 IF sid IS NULL THEN INSERT INTO lms.course_sections(course_id,title,section_order) VALUES(cid,'Hướng dẫn, bài học và thực hành',1) RETURNING section_id INTO sid; END IF;
 UPDATE lms.lessons SET lesson_order=lesson_order+10000 WHERE course_id=cid;
 pos=0;used='{}';
 FOR l IN SELECT value FROM jsonb_array_elements(c->'lessons') LOOP
  pos=pos+1;
  SELECT x.lesson_id INTO lid FROM lms.lessons x LEFT JOIN lms.lesson_pedagogy p USING(lesson_id) WHERE x.course_id=cid AND NOT x.is_deleted AND (p.content_key='curated-202611.'||(c->>'key')||'.'||pos OR regexp_replace(x.title,'^[0-9]+[[:space:]]*[·.-][[:space:]]*','')=regexp_replace(l->>'title','^[0-9]+[[:space:]]*[·.-][[:space:]]*','')) AND NOT(x.lesson_id=ANY(used)) ORDER BY x.lesson_id LIMIT 1;
  IF lid IS NULL THEN INSERT INTO lms.lessons(course_id,title,lesson_order) VALUES(cid,l->>'title',pos) RETURNING lesson_id INTO lid; END IF;
  UPDATE lms.lessons SET title=l->>'title',content=l->>'content',lesson_order=pos,estimated_duration_seconds=(l->>'seconds')::int,is_published=true,is_deleted=false,deleted_at=NULL,section_id=sid WHERE lesson_id=lid;
  used=array_append(used,lid);
  INSERT INTO lms.lesson_pedagogy(lesson_id,difficulty,kind,is_core,skills,goals,prerequisites,outcomes,sources,content_key)
  VALUES(lid,CASE WHEN pos>5 THEN 2 ELSE 1 END,CASE WHEN pos=1 THEN 'REVIEW' WHEN c->>'key' LIKE '%-lab' OR l->>'title' ~* 'Thực hành|Dự án' THEN 'PRACTICE' ELSE 'CONCEPT' END,pos<=3,jsonb_build_array(c->>'key'),'["FOUNDATION","PRACTICAL","CERTIFICATION"]'::jsonb,CASE WHEN pos=1 THEN '[]'::jsonb ELSE jsonb_build_array(used[pos-1]) END,jsonb_build_array(l->>'title'),'[]'::jsonb,'curated-202611.'||(c->>'key')||'.'||pos)
  ON CONFLICT(lesson_id) DO UPDATE SET kind=EXCLUDED.kind,is_core=EXCLUDED.is_core,skills=EXCLUDED.skills,goals=EXCLUDED.goals,prerequisites=EXCLUDED.prerequisites,outcomes=EXCLUDED.outcomes,content_key=EXCLUDED.content_key;
  DELETE FROM lms.lesson_resources WHERE lesson_id=lid;
  n=0;FOR r IN SELECT value FROM jsonb_array_elements(l->'resources') LOOP
   n=n+1;INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order) VALUES(lid,r->>'type',left(r->>'title',220),r->>'url',n) RETURNING resource_id INTO rid;
  END LOOP;
 END LOOP;
 UPDATE lms.lessons SET is_published=false WHERE course_id=cid AND NOT(lesson_id=ANY(used));
 SELECT resource_id INTO rid FROM lms.lesson_resources WHERE lesson_id=used[1] AND resource_type='PDF' ORDER BY display_order LIMIT 1;
 INSERT INTO lms.course_overviews(course_id,audience,preparation,outcomes,practice_note,syllabus_resource_id)
 VALUES(cid,'Học viên tự học theo hướng dẫn và yêu cầu đầu khóa.',c->>'preparation',(SELECT jsonb_agg(value->>'title') FROM jsonb_array_elements(c->'lessons')),'Hoàn thành bài học và đạt quiz từ 7/10. Bài thực hành/tự luận dùng luyện tập, chưa tự chấm sản phẩm; chứng nhận hoàn thành VEDU không thay chứng chỉ chính thức.',rid)
 ON CONFLICT(course_id) DO UPDATE SET preparation=EXCLUDED.preparation,outcomes=EXCLUDED.outcomes,practice_note=EXCLUDED.practice_note,syllabus_resource_id=EXCLUDED.syllabus_resource_id;
 UPDATE assessment.quizzes SET is_published=false WHERE course_id=cid;
 INSERT INTO assessment.quizzes(course_id,title,description,time_limit_seconds,passing_score,max_attempts,is_published)
 VALUES(cid,'Thi cuối khóa — '||(c->>'name'),'Bài kiểm tra kiến thức VEDU 2026.11, không phải đề thi của trường. Bài thực hành đánh giá theo rubric riêng.',GREATEST(1200,jsonb_array_length(c->'questions')*60),7,3,true) RETURNING quiz_id INTO qid;
 n=0;FOR q IN SELECT value FROM jsonb_array_elements(c->'questions') LOOP
  n=n+1;INSERT INTO assessment.questions(quiz_id,question_text,question_type,question_order,points) VALUES(qid,q->>'text','SINGLE_CHOICE',n,1) RETURNING question_id INTO lid;
  ai=0;rotation=(n-1)%jsonb_array_length(q->'options');FOR a IN SELECT value FROM jsonb_array_elements(q->'options') LOOP
   INSERT INTO assessment.answers(question_id,answer_text,is_correct,answer_order) VALUES(lid,a#>>'{}',ai=(q->>'correct')::int,1+((ai+rotation)%jsonb_array_length(q->'options')));ai=ai+1;
  END LOOP;
 END LOOP;
END LOOP;
INSERT INTO lms.catalog_retirements(course_id,previous_teacher_id,previous_status) SELECT course_id,teacher_id,status FROM lms.courses WHERE NOT(course_id=ANY(selected)) AND NOT is_deleted ON CONFLICT DO NOTHING;
UPDATE lms.courses c SET status='ARCHIVED',is_deleted=true,deleted_at=now(),teacher_id=CASE WHEN EXISTS(SELECT 1 FROM auth.users u WHERE u.user_id=c.teacher_id AND u.role='TEACHER' AND u.is_active) THEN c.teacher_id ELSE teacherids[1] END WHERE NOT(course_id=ANY(selected)) AND NOT is_deleted;
IF cardinality(selected)<>21 THEN RAISE EXCEPTION 'Catalog must contain 21 courses'; END IF;
INSERT INTO lms.catalog_revisions(revision) VALUES('2026.11.2');
END $curated$;
COMMIT;
`;
mkdirSync('database/vedu',{recursive:true});writeFileSync('database/vedu/curated_catalog.sql',sql);
// Assets stay on the media volume; non-PDF handouts are simple downloads.
const localMedia=resolve('backend/media');mkdirSync(localMedia,{recursive:true});mkdirSync('frontend/public/course-materials/batch-assets',{recursive:true});
for(const c of raw.courses)for(const f of c.files.filter(f=>f.legacy))copyFileSync(resolve('data/learning/software-course-assets',f.file),resolve('data/learning/curated-assets',f.file));
for(const f of readdirSync('data/learning/curated-assets')){const src=resolve('data/learning/curated-assets',f);copyFileSync(src,resolve(localMedia,f));if(!f.endsWith('.pdf'))copyFileSync(src,resolve('frontend/public/course-materials/batch-assets',f));}
const backend=spawnSync('docker',['compose','ps','-q','backend'],{encoding:'utf8'}).stdout.trim();
if(backend){const cp=spawnSync('docker',['cp',resolve('data/learning/curated-assets')+'/.',`${backend}:/app/media`],{encoding:'utf8'});if(cp.status)throw Error(cp.stderr);}
await db.query(sql);
const {rows:catalog}=await db.query("SELECT c.course_id AS id,c.course_name AS title,c.topic,coalesce(jsonb_agg(l.title ORDER BY l.lesson_order) FILTER(WHERE l.lesson_id IS NOT NULL),'[]') AS \"lessonTitles\" FROM lms.courses c LEFT JOIN lms.lessons l ON l.course_id=c.course_id AND NOT l.is_deleted AND l.is_published WHERE NOT c.is_deleted AND c.status='PUBLISHED' GROUP BY c.course_id ORDER BY c.course_id");
writeFileSync('data/course-covers/catalog.json',JSON.stringify(catalog,null,2));
writeFileSync('data/learning/catalog-selection.json',JSON.stringify(catalog,null,2));
console.log('Published courses:',catalog.length,'; fictional teacher usernames:',teachers.map(t=>t.username).join(', '));
await db.end();
