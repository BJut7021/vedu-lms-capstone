import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { AccessService, Actor } from '../auth/access.service';

type RubricItem = { id: string; label: string; skill: string; max: number; min: number };
type Upload = { buffer: Buffer; originalname: string };

@Injectable()
export class CourseAssignmentService {
  constructor(private readonly db: DataSource, private readonly access: AccessService) {}

  async list(actor: Actor, courseId: number) {
    const student = actor.role === 'STUDENT';
    if (student) await this.access.study(actor, courseId);
    else await this.access.manageCourse(actor, courseId);
    const assignments = await this.db.query(
      `SELECT a.*, s.title AS section_title FROM assessment.course_assignments a
       LEFT JOIN lms.course_sections s USING(section_id) WHERE a.course_id=$1
       AND (NOT $2::boolean OR (a.is_published AND NOT a.is_archived))
       ORDER BY s.section_order NULLS LAST,a.assignment_id`,
      [courseId, student],
    );
    const versions = await this.db.query(
      `SELECT v.version_id,v.assignment_id,v.student_id,v.attempt_id,v.version_no,v.status,v.answer_text,v.answer_url,
         v.file_name,v.rubric_scores,v.score,v.outcome,v.feedback,v.updated_at,u.full_name
       FROM assessment.course_assignment_versions v JOIN assessment.course_assignments a USING(assignment_id)
       JOIN auth.users u ON u.user_id=v.student_id
       WHERE a.course_id=$1 AND CASE WHEN $2::boolean THEN v.student_id=$3 ELSE v.status<>'DRAFT' END
       ORDER BY v.updated_at DESC,v.version_id DESC`,
      [courseId, student, actor.userId],
    );
    const modules = await this.db.query(
      'SELECT section_id,title FROM lms.course_sections WHERE course_id=$1 ORDER BY section_order,section_id',
      [courseId],
    );
    return { assignments, versions, modules };
  }

  async mine(actor: Actor) {
    if (actor.role !== 'STUDENT' || actor.isGuest) throw new ForbiddenException();
    return this.db.query(
      `SELECT a.assignment_id,a.course_id,a.section_id,a.title,a.instructions,a.required,a.passing_score,a.due_at,
        c.course_name,s.title AS section_title,
        v.version_id,v.version_no,v.status,v.outcome,v.score,v.feedback,v.updated_at,
        COALESCE(l.lesson_id,(SELECT min(l2.lesson_id) FROM lms.lessons l2 WHERE l2.section_id=a.section_id AND l2.is_published AND NOT l2.is_deleted)) AS lesson_id,
        (SELECT q.quiz_id FROM assessment.quizzes q WHERE q.course_id=a.course_id AND q.lesson_id IS NULL AND q.is_published AND NOT q.is_deleted ORDER BY q.quiz_id DESC LIMIT 1) AS final_quiz_id
       FROM assessment.course_assignments a JOIN lms.courses c USING(course_id)
       LEFT JOIN lms.course_sections s USING(section_id)
       LEFT JOIN LATERAL (SELECT lesson_id FROM lms.lessons WHERE section_id=a.section_id AND is_published AND NOT is_deleted ORDER BY lesson_order,lesson_id LIMIT 1) l ON true
       LEFT JOIN LATERAL (SELECT v.* FROM assessment.course_assignment_versions v
         WHERE v.assignment_id=a.assignment_id AND v.student_id=$1 ORDER BY v.version_no DESC LIMIT 1) v ON true
       WHERE a.is_published AND NOT a.is_archived AND EXISTS(
         SELECT 1 FROM enrollment.enrollments e WHERE e.course_id=a.course_id AND e.student_id=$1 AND e.status IN ('ACTIVE','COMPLETED'))
       ORDER BY CASE COALESCE(v.status,'NOT_STARTED') WHEN 'NEEDS_REVISION' THEN 0 WHEN 'NOT_STARTED' THEN 1 WHEN 'DRAFT' THEN 2 WHEN 'SUBMITTED' THEN 3 WHEN 'UNDER_REVIEW' THEN 4 ELSE 5 END,
         a.due_at NULLS LAST,a.assignment_id`,
      [actor.userId],
    );
  }

  async create(actor: Actor, courseId: number, body: Record<string, unknown>) {
    await this.access.manageCourse(actor, courseId);
    const data = await this.authoringData(courseId, body);
    const [created] = await this.db.query(
      `INSERT INTO assessment.course_assignments(course_id,section_id,assignment_key,title,instructions,rubric,passing_score,required,is_published,is_archived,allowed_file_types,due_at,created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,false,$10,$11,$12) RETURNING *`,
      [courseId,data.sectionId,randomUUID(),data.title,data.instructions,JSON.stringify(data.rubric),data.passingScore,data.required,data.published,data.allowedTypes,data.dueAt,actor.userId],
    );
    return created;
  }

  async update(actor: Actor, id: number, body: Record<string, unknown>) {
    const [current] = await this.db.query('SELECT * FROM assessment.course_assignments WHERE assignment_id=$1', [id]);
    if (!current) throw new NotFoundException('Không tìm thấy bài tập');
    await this.access.manageCourse(actor, Number(current.course_id));
    const data = await this.authoringData(Number(current.course_id), body);
    const [used] = await this.db.query('SELECT 1 FROM assessment.course_assignment_versions WHERE assignment_id=$1 LIMIT 1', [id]);
    const rubricSignature = (items: RubricItem[]) => JSON.stringify(items.map((x) => ({ id:String(x.id),label:String(x.label),skill:String(x.skill),max:Number(x.max),min:Number(x.min) })));
    const sameTypes = [...data.allowedTypes].sort().join(',') === [...(current.allowed_file_types || [])].map(String).sort().join(',');
    if (used && (data.title !== current.title || data.instructions !== current.instructions ||
      rubricSignature(data.rubric) !== rubricSignature(current.rubric) || data.sectionId !== (current.section_id == null ? null : Number(current.section_id)) ||
      data.passingScore !== Number(current.passing_score) || data.required !== current.required || !sameTypes))
      throw new ConflictException('Bài đã có lượt nộp; chỉ được đổi trạng thái công bố hoặc hạn nộp để bảo toàn lịch sử');
    const [updated] = await this.db.query(
      `UPDATE assessment.course_assignments SET section_id=$2,title=$3,instructions=$4,rubric=$5,passing_score=$6,
       required=$7,is_published=$8,allowed_file_types=$9,due_at=$10,updated_at=now() WHERE assignment_id=$1 RETURNING *`,
      [id,data.sectionId,data.title,data.instructions,JSON.stringify(data.rubric),data.passingScore,data.required,data.published,data.allowedTypes,data.dueAt],
    );
    return updated;
  }

  async archive(actor: Actor, id: number) {
    const [current] = await this.db.query('SELECT course_id FROM assessment.course_assignments WHERE assignment_id=$1', [id]);
    if (!current) throw new NotFoundException('Không tìm thấy bài tập');
    await this.access.manageCourse(actor, Number(current.course_id));
    await this.db.query('UPDATE assessment.course_assignments SET is_archived=true,is_published=false,updated_at=now() WHERE assignment_id=$1', [id]);
    return { archived: true };
  }

  private async authoringData(courseId: number, body: Record<string, unknown>) {
    const sectionId = body.sectionId == null || body.sectionId === '' ? null : Number(body.sectionId);
    if (sectionId !== null) {
      const [section] = await this.db.query('SELECT 1 FROM lms.course_sections WHERE section_id=$1 AND course_id=$2', [sectionId, courseId]);
      if (!section) throw new BadRequestException('Mô-đun không thuộc khóa học');
    }
    const title = String(body.title ?? '').trim();
    const instructions = String(body.instructions ?? '').trim();
    if (!title || title.length > 250 || !instructions || instructions.length > 10000) throw new BadRequestException('Cần tiêu đề và hướng dẫn hợp lệ');
    const rubric = body.rubric as RubricItem[];
    if (!Array.isArray(rubric) || !rubric.length || rubric.length > 10 || rubric.some((x) => !x?.id || !x?.label || !x?.skill || !Number.isFinite(Number(x.max)) || Number(x.max) <= 0 || Number(x.min) < 0 || Number(x.min) > Number(x.max)))
      throw new BadRequestException('Rubric không hợp lệ');
    const total = rubric.reduce((sum, x) => sum + Number(x.max), 0);
    if (Math.abs(total - 10) > 0.001) throw new BadRequestException('Tổng điểm rubric phải bằng 10');
    const passingScore = Number(body.passingScore ?? 7);
    if (!Number.isFinite(passingScore) || passingScore < 0 || passingScore > 10) throw new BadRequestException('Điểm đạt phải từ 0 đến 10');
    const allowed = Array.isArray(body.allowedFileTypes) ? body.allowedFileTypes.map(String) : ['pdf','docx','xlsx','pptx','zip'];
    const allowedTypes = [...new Set(allowed.map((x) => x.toLowerCase()))].filter((x) => ['pdf','docx','xlsx','pptx','zip'].includes(x));
    if (!allowedTypes.length) throw new BadRequestException('Cần ít nhất một loại tệp');
    const dueAt = body.dueAt ? new Date(String(body.dueAt)) : null;
    if (dueAt && Number.isNaN(dueAt.getTime())) throw new BadRequestException('Hạn nộp không hợp lệ');
    return { sectionId,title,instructions,rubric,passingScore,allowedTypes,dueAt,required: body.required !== false,published: body.published !== false };
  }

  async save(actor: Actor, id: number, body: Record<string, unknown>, file?: Upload) {
    if (actor.role !== 'STUDENT' || actor.isGuest) throw new ForbiddenException();
    const [assignment] = await this.db.query(
      'SELECT * FROM assessment.course_assignments WHERE assignment_id=$1 AND is_published AND NOT is_archived',
      [id],
    );
    if (!assignment) throw new NotFoundException('Không tìm thấy bài tập');
    await this.access.study(actor, Number(assignment.course_id));
    const answer = String(body.answer ?? '').trim();
    const link = String(body.link ?? '').trim();
    const submit = body.submit === 'true' || body.submit === true;
    const attemptId = body.attemptId ? Number(body.attemptId) : null;
    if (answer.length > 20000 || link.length > 2048) throw new BadRequestException('Nội dung vượt giới hạn');
    if (link) {
      let url: URL;
      try { url = new URL(link); } catch { throw new BadRequestException('Liên kết không hợp lệ'); }
      if (url.protocol !== 'https:' || url.username || url.password)
        throw new BadRequestException('Chỉ nhận liên kết HTTPS không chứa thông tin đăng nhập');
    }
    const filename = file ? this.checkFile(file, assignment.allowed_file_types) : null;
    return this.db.transaction(async (m) => {
      await m.query('SELECT pg_advisory_xact_lock($1::integer,$2::integer)', [id, actor.userId]);
      if (assignment.section_id == null) {
        if (!Number.isSafeInteger(attemptId) || Number(attemptId) <= 0)
          throw new BadRequestException('Cần nộp trắc nghiệm của lượt thi trước');
        const [attempt] = await m.query(
          `SELECT 1 FROM assessment.quiz_attempts a JOIN assessment.quizzes q USING(quiz_id)
           JOIN lms.courses c ON c.course_id=a.course_id
           WHERE a.attempt_id=$1 AND a.student_id=$2 AND a.course_id=$3 AND a.status='GRADED'
             AND q.lesson_id IS NULL AND q.is_published AND NOT q.is_deleted AND c.final_mode IN ('MCQ_PRACTICAL','MCQ_ESSAY')`,
          [attemptId, actor.userId, assignment.course_id],
        );
        if (!attempt) throw new ForbiddenException('Lượt thi không hợp lệ');
      } else if (attemptId !== null) {
        throw new BadRequestException('Bài mô-đun không gắn với lượt thi cuối khóa');
      }
      const [latest] = await m.query(
        `SELECT version_id,status,outcome,version_no,file_name FROM assessment.course_assignment_versions
         WHERE assignment_id=$1 AND student_id=$2 AND attempt_id IS NOT DISTINCT FROM $3::bigint
         ORDER BY version_no DESC LIMIT 1 FOR UPDATE`,
        [id, actor.userId, attemptId],
      );
      if (latest && !['DRAFT','NEEDS_REVISION'].includes(latest.status) && (latest.status !== 'GRADED' || latest.outcome === 'PASS' || attemptId))
        throw new ConflictException('Phiên bản này đã được gửi hoặc chấm. Hãy xem phản hồi.');
      const status = submit ? 'SUBMITTED' : 'DRAFT';
      if (submit && ['formula-lab','final-practical'].includes(assignment.assignment_key) &&
        !(filename ?? (latest?.status === 'DRAFT' ? latest.file_name : null))?.toLowerCase().endsWith('.xlsx'))
        throw new BadRequestException('Bài thực hành này yêu cầu tệp XLSX');
      if (submit && !answer && !link && !file && !(latest?.status === 'DRAFT' && latest.file_name))
        throw new BadRequestException('Hãy nhập nội dung, liên kết hoặc chọn tệp');
      const [saved] = latest?.status === 'DRAFT'
        ? await m.query(
          `WITH updated AS (UPDATE assessment.course_assignment_versions SET status=$2,answer_text=$3,answer_url=$4,
             file_data=COALESCE($5,file_data),file_name=COALESCE($6,file_name),updated_at=now()
           WHERE version_id=$1 RETURNING version_id,status) SELECT * FROM updated`,
          [latest.version_id,status,answer,link || null,file?.buffer ?? null,filename],
        )
        : await m.query(
          `INSERT INTO assessment.course_assignment_versions(assignment_id,student_id,attempt_id,version_no,status,answer_text,answer_url,file_data,file_name)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING version_id,status`,
          [id,actor.userId,attemptId,(latest?.version_no ?? 0)+1,status,answer,link || null,file?.buffer ?? null,filename],
        );
      if (submit) await m.query(
        `INSERT INTO auth.notifications(user_id,title,body,route)
         SELECT teacher_id,'Có bài nộp mới',$2,'/teacher/assessments' FROM lms.courses WHERE course_id=$1
         UNION SELECT teacher_id,'Có bài nộp mới',$2,'/teacher/assessments' FROM lms.course_teachers WHERE course_id=$1`,
        [assignment.course_id, `${assignment.title} — học viên vừa nộp phiên bản mới.`],
      );
      return saved;
    });
  }

  private checkFile(file: Upload, allowed: string[] = ['pdf','docx','xlsx','pptx','zip']) {
    const name = file.originalname.replace(/[^\p{L}\p{N} ._-]/gu, '_').slice(-150);
    const ext = name.split('.').pop()?.toLowerCase();
    const b = file.buffer;
    const zip = b.subarray(0,4).equals(Buffer.from([80,75,3,4]));
    const pdf = b.subarray(0,5).toString() === '%PDF-';
    const officeParts: Record<string, string> = { docx: 'word/document.xml', xlsx: 'xl/workbook.xml', pptx: 'ppt/presentation.xml' };
    const office = ext && officeParts[ext] && zip && b.includes(officeParts[ext]) && !b.includes('vbaProject.bin');
    if (!ext || !allowed.includes(ext) || b.length > 5 * 1024 * 1024 || !(ext === 'pdf' && pdf || ext === 'zip' && zip || office))
      throw new BadRequestException(`Chỉ nhận ${allowed.join(', ').toUpperCase()} hợp lệ, tối đa 5 MB`);
    return name;
  }

  private async version(actor: Actor, id: number, manage = false) {
    const [v] = await this.db.query(
      `SELECT v.version_id,v.student_id,v.status,v.file_name,a.course_id,a.rubric,a.passing_score
       FROM assessment.course_assignment_versions v JOIN assessment.course_assignments a USING(assignment_id)
       WHERE v.version_id=$1`, [id],
    );
    if (!v) throw new NotFoundException('Không tìm thấy bài nộp');
    if (actor.role === 'STUDENT') {
      if (manage || Number(v.student_id) !== actor.userId) throw new ForbiddenException();
      await this.access.study(actor, Number(v.course_id));
    } else {
      await this.access.manageCourse(actor, Number(v.course_id));
      if (v.status === 'DRAFT') throw new NotFoundException('Bài chưa nộp');
    }
    return v;
  }

  async download(actor: Actor, id: number) {
    const v = await this.version(actor, id);
    const [file] = await this.db.query('SELECT file_data FROM assessment.course_assignment_versions WHERE version_id=$1', [id]);
    if (!file?.file_data) throw new NotFoundException('Bài không có tệp');
    return { name: v.file_name, data: file.file_data };
  }

  async grade(actor: Actor, id: number, body: Record<string, unknown>) {
    const v = await this.version(actor, id, true);
    const action = body.action;
    if (action === 'REVIEW') {
      await this.db.query("UPDATE assessment.course_assignment_versions SET status='UNDER_REVIEW',updated_at=now() WHERE version_id=$1 AND status='SUBMITTED'", [id]);
      return { status: 'UNDER_REVIEW' };
    }
    if (action !== 'PASS' && action !== 'FAIL' && action !== 'REVISE') throw new BadRequestException('Kết luận không hợp lệ');
    const rubric = v.rubric as RubricItem[];
    const scores = body.scores as Record<string, unknown> | undefined;
    const feedback = String(body.feedback ?? '').trim();
    if (!feedback || feedback.length > 3000) throw new BadRequestException('Cần phản hồi từ 1 đến 3000 ký tự');
    const values = rubric.map((criterion) => {
      const value = scores?.[criterion.id];
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > criterion.max)
        throw new BadRequestException('Cần điểm hợp lệ cho từng tiêu chí rubric');
      return { ...criterion, value };
    });
    const score = Math.round(1000 * values.reduce((sum, item) => sum + item.value, 0) / values.reduce((sum, item) => sum + item.max, 0)) / 100;
    if (action === 'PASS' && (score < Number(v.passing_score) || values.some((item) => item.value < item.min)))
      throw new BadRequestException('Điểm hoặc tiêu chí bắt buộc chưa đạt');
    const status = action === 'REVISE' ? 'NEEDS_REVISION' : 'GRADED';
    const [graded] = await this.db.query(
      `WITH updated AS (UPDATE assessment.course_assignment_versions SET status=$2,outcome=$3,rubric_scores=$4,score=$5,feedback=$6,
         graded_by=$7,graded_at=now(),updated_at=now()
       WHERE version_id=$1 AND status IN ('SUBMITTED','UNDER_REVIEW') RETURNING version_id,status,outcome,score) SELECT * FROM updated`,
      [id,status,action,JSON.stringify(Object.fromEntries(values.map((item) => [item.id,item.value]))),score,feedback,actor.userId],
    );
    if (!graded) throw new ConflictException('Phiên bản đã được xử lý');
    await this.db.query(
      `INSERT INTO auth.notifications(user_id,title,body,route) VALUES($1,$2,$3,$4)`,
      [Number(v.student_id), action === 'REVISE' ? 'Bài nộp cần chỉnh sửa' : 'Bài nộp đã được chấm', feedback, '/student/submissions'],
    );
    return graded;
  }
}
