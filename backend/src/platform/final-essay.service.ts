import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AccessService, Actor } from '../auth/access.service';
@Injectable()
export class FinalEssayService {
 constructor(private readonly db:DataSource, private readonly access:AccessService){}
 private async getQuiz(quizId:number){
   const [q] = await this.db.query(`SELECT quiz_id, course_id, lesson_id, title FROM assessment.quizzes WHERE quiz_id=$1 AND NOT is_deleted AND is_published`,[quizId]);
   if(!q || q.lesson_id != null) throw new NotFoundException('Không tìm thấy bài thi cuối khóa');
   return q;
 }
 async prompt(quizId:number,actor:Actor){
   const q=await this.getQuiz(quizId);
   if(actor.role==='STUDENT') await this.access.study(actor,Number(q.course_id));
   else await this.access.manageCourse(actor,Number(q.course_id));
   const [p]=await this.db.query('SELECT prompt_text FROM assessment.final_essay_prompts WHERE quiz_id=$1',[quizId]);
   return {quizId,courseId:Number(q.course_id),prompt:p?.prompt_text || '',weightMcq:0.4,weightEssay:0.6,passingScore:5};
 }
 async savePrompt(quizId:number,actor:Actor,raw:any){
   const q=await this.getQuiz(quizId);
   await this.access.manageCourse(actor,Number(q.course_id));
   const value=String(raw?.prompt ?? '').trim();
   if(!value || value.length>10000) throw new BadRequestException('Đề tự luận phải có nội dung (tối đa 10000 ký tự)');
   await this.db.query(`INSERT INTO assessment.final_essay_prompts(quiz_id,prompt_text,updated_by) VALUES($1,$2,$3) ON CONFLICT(quiz_id) DO UPDATE SET prompt_text=EXCLUDED.prompt_text,updated_by=EXCLUDED.updated_by,updated_at=now()`,[quizId,value,actor.userId]);
   return {saved:true};
 }
 async submitImage(attemptId:number,actor:Actor,file?:{buffer:Buffer; mimetype:string;originalname:string}){
   if(actor.role!=='STUDENT') throw new ForbiddenException();
   if(!file?.buffer?.length || file.buffer.length>5*1024*1024) throw new BadRequestException('Cần ảnh dung lượng tối đa 5MB');
   const b=file.buffer;
   const jpg=b.length>=3&&b[0]===255&&b[1]===216&&b[2]===255;
   const png=b.length>=8&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
   const webp=b.length>=12&&b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP';
   const mime=jpg?'image/jpeg':png?'image/png':webp?'image/webp':null;
   if(!mime || mime!==file.mimetype) throw new BadRequestException('Chỉ chấp nhận ảnh JPG, PNG, WEBP hợp lệ');
   return this.db.transaction(async m=>{
     const [a]=await m.query(`SELECT a.attempt_id,a.quiz_id,a.course_id,a.student_id,a.status,q.lesson_id FROM assessment.quiz_attempts a JOIN assessment.quizzes q USING(quiz_id) WHERE a.attempt_id=$1 AND a.student_id=$2 FOR UPDATE OF a`,[attemptId,actor.userId]);
     if(!a || a.lesson_id!=null || a.status!=='GRADED') throw new BadRequestException('Cần nộp phần trắc nghiệm cuối khóa trước khi gửi ảnh');
     await this.access.study(actor,Number(a.course_id));
     const [p]=await m.query('SELECT prompt_text FROM assessment.final_essay_prompts WHERE quiz_id=$1',[a.quiz_id]);
     if(!p?.prompt_text?.trim()) throw new BadRequestException('Giảng viên chưa đăng đề tự luận');
     const [already]=await m.query('SELECT attempt_id FROM assessment.final_essay_submissions WHERE attempt_id=$1',[attemptId]);
     if(already) throw new BadRequestException('Bài tự luận đã nộp, không thể thay đổi');
     await m.query(`INSERT INTO assessment.final_essay_submissions(attempt_id,quiz_id,student_id,image_data,image_mime,file_name) VALUES($1,$2,$3,$4,$5,$6)`,[attemptId,a.quiz_id,actor.userId,b,mime,String(file.originalname||'essay').slice(0,180)]);
     return {status:'PENDING_REVIEW',attemptId};
   });
 }
 async result(attemptId:number,actor:Actor){
   const [a]=await this.db.query(`SELECT a.*,q.lesson_id FROM assessment.quiz_attempts a JOIN assessment.quizzes q USING(quiz_id) WHERE attempt_id=$1`,[attemptId]);
   if(!a || a.lesson_id!=null) throw new NotFoundException();
   if(actor.role==='STUDENT'){
     if(Number(a.student_id)!==actor.userId) throw new ForbiddenException();
     await this.access.study(actor,Number(a.course_id));
   }else await this.access.manageCourse(actor,Number(a.course_id));
   const [s]=await this.db.query(`SELECT grade,feedback,submitted_at,graded_at FROM assessment.final_essay_submissions WHERE attempt_id=$1`,[attemptId]);
   const status=!s?'AWAITING_UPLOAD':s.grade==null?'PENDING_REVIEW':'GRADED';
   const total=s?.grade==null?null:Math.round((Number(a.score)*0.4+Number(s.grade)*0.6)*100)/100;
   return {attemptId,quizId:Number(a.quiz_id),mcqScore:a.score==null?null:Number(a.score),essayScore:s?.grade==null?null:Number(s.grade),finalScore:total,passed:total==null?null:total>=5,status,feedback:s?.feedback||'',submittedAt:s?.submitted_at||null,gradedAt:s?.graded_at||null};
 }

  async reviewQuiz(attemptId: number, actor: Actor) {
    if (actor.role !== 'STUDENT') throw new ForbiddenException();
    const [attempt] = await this.db.query(
      `SELECT a.attempt_id, a.quiz_id, a.course_id, a.student_id, a.status, q.lesson_id
       FROM assessment.quiz_attempts a JOIN assessment.quizzes q ON q.quiz_id=a.quiz_id
       WHERE a.attempt_id=$1`, [attemptId]);
    if (!attempt || Number(attempt.student_id) !== actor.userId || attempt.lesson_id != null)
      throw new NotFoundException('Không tìm thấy bài thi cuối khóa');
    await this.access.study(actor, Number(attempt.course_id));
    if (attempt.status === 'IN_PROGRESS') throw new ForbiddenException('Bạn chưa nộp bài thi');
    const questions: any[] = await this.db.query(
      `SELECT question_id, question_text, question_type, question_order
       FROM assessment.questions WHERE quiz_id=$1 ORDER BY question_order, question_id`, [attempt.quiz_id]);
    const options: any[] = await this.db.query(
      `SELECT a.question_id,a.answer_id,a.answer_text,a.is_correct,a.answer_order
       FROM assessment.answers a JOIN assessment.questions q ON q.question_id=a.question_id
       WHERE q.quiz_id=$1 ORDER BY q.question_order,a.answer_order,a.answer_id`, [attempt.quiz_id]);
    const selected: any[] = await this.db.query(
      `SELECT question_id, answer_id FROM assessment.quiz_attempt_answers WHERE attempt_id=$1`, [attemptId]);
    const byQuestion = new Map<number, Set<number>>();
    for (const a of selected) {
      const id = Number(a.question_id);
      if (!byQuestion.has(id)) byQuestion.set(id, new Set<number>());
      if (a.answer_id != null) byQuestion.get(id)!.add(Number(a.answer_id));
    }
    return { attemptId, questions: questions.map((q) => {
      const id = Number(q.question_id);
      const opts = options.filter((o) => Number(o.question_id) === id);
      const selectedIds = Array.from(byQuestion.get(id) || new Set<number>());
      const correctIds = opts.filter((o) => o.is_correct === true).map((o) => Number(o.answer_id));
      const correct = selectedIds.length > 0 && correctIds.length === selectedIds.length && correctIds.every((x) => selectedIds.includes(x));
      return { questionId:id, text:q.question_text, type:q.question_type, correct, selectedIds, correctIds,
        options: opts.map((o) => ({id:Number(o.answer_id), text:o.answer_text})) };
    }) };
  }
 async pending(actor:Actor,courseId:number){
   await this.access.manageCourse(actor,courseId);
   const rows=await this.db.query(`SELECT s.attempt_id,s.quiz_id,q.title AS quiz_title,u.full_name AS student_name,s.student_id,s.submitted_at,s.grade,s.feedback,a.score AS mcq_score FROM assessment.final_essay_submissions s JOIN assessment.quiz_attempts a USING(attempt_id) JOIN assessment.quizzes q ON q.quiz_id=s.quiz_id JOIN auth.users u ON u.user_id=s.student_id WHERE q.course_id=$1 AND q.lesson_id IS NULL ORDER BY s.graded_at NULLS FIRST,s.submitted_at DESC`,[courseId]);
   return rows.map((r:any)=>({...r,image_data:undefined}));
 }
 async image(attemptId:number,actor:Actor){
   const [s]=await this.db.query(`SELECT s.image_data,s.image_mime,a.course_id,a.student_id FROM assessment.final_essay_submissions s JOIN assessment.quiz_attempts a USING(attempt_id) WHERE s.attempt_id=$1`,[attemptId]);
   if(!s) throw new NotFoundException();
   if(actor.role==='STUDENT'){
     if(Number(s.student_id)!==actor.userId) throw new ForbiddenException();
     await this.access.study(actor,Number(s.course_id));
   }else await this.access.manageCourse(actor,Number(s.course_id));
   return {bytes:s.image_data,mime:s.image_mime};
 }
 async grade(attemptId:number,actor:Actor,body:any){
   const value=Number(body?.grade);const feedback=String(body?.feedback??'').trim();
   if(body?.grade===undefined || body?.grade===null || body?.grade==='' || !Number.isFinite(value)||value<0||value>10 || feedback.length>3000) throw new BadRequestException('Điểm tự luận phải từ 0 đến 10; nhận xét tối đa 3000 ký tự');
   const [row]=await this.db.query(`SELECT a.course_id FROM assessment.final_essay_submissions s JOIN assessment.quiz_attempts a USING(attempt_id) WHERE s.attempt_id=$1`,[attemptId]);
   if(!row) throw new NotFoundException('Không tìm thấy bài tự luận');
   await this.access.manageCourse(actor,Number(row.course_id));
   const updated=await this.db.query(`UPDATE assessment.final_essay_submissions SET grade=$2,feedback=$3,graded_by=$4,graded_at=now() WHERE attempt_id=$1 AND grade IS NULL RETURNING attempt_id`,[attemptId,value,feedback,actor.userId]);
   if(!updated.length) throw new BadRequestException('Bài đã được chấm. Không thể chấm lại trong phiên bản này.');
   return this.result(attemptId,actor);
 }
}
