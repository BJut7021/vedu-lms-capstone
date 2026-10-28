import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { JwtService } from '@nestjs/jwt';
import { AccessService, Actor } from '../auth/access.service';
import { CoursesService } from '../courses/courses.service';
import { RecommendationService } from './recommendation.service';

@Injectable()
export class PlatformService {
  constructor(
    private readonly db: DataSource,
    private readonly access: AccessService,
    private readonly courses: CoursesService,
    private readonly jwt: JwtService,
    private readonly recommendations: RecommendationService,
  ) {}
  async studyState(actor: Actor, courseId: number) {
    // Public curriculum metadata plus only this account's progress; this GET never enrolls or unlocks content.
    const course = await this.courses.findOne(courseId, false);
    const lessons = course.sections
      .flatMap((s) => s.lessons)
      .filter((l) => l.id > 0 && l.type !== 'quiz');
    const [progress, quizzes] = await Promise.all([
      this.db.query(
        'SELECT lesson_id,status,last_viewed_at,updated_at FROM learning.lesson_progress WHERE student_id=$1 AND course_id=$2',
        [actor.userId, courseId],
      ),
      this.db.query(
        `SELECT q.quiz_id,
        EXISTS(SELECT 1 FROM assessment.quiz_attempts a WHERE a.quiz_id=q.quiz_id AND a.student_id=$2 AND a.status IN ('SUBMITTED','GRADED') AND a.score>=q.passing_score) AS passed,
        EXISTS(SELECT 1 FROM assessment.quiz_attempts a WHERE a.quiz_id=q.quiz_id AND a.student_id=$2) AS attempted
        FROM assessment.quizzes q WHERE q.course_id=$1 AND q.is_published AND NOT q.is_deleted ORDER BY q.quiz_id`,
        [courseId, actor.userId],
      ),
    ]);
    const done = new Set<number>(
      progress
        .filter((p: any) => p.status === 'COMPLETED')
        .map((p: any) => Number(p.lesson_id)),
    );
    const previewIds = course.sections
      .flatMap((s) => s.lessons)
      .filter((l) => l.id > 0)
      .slice(0, 2)
      .map((l) => l.id);
    const allowed = actor.isGuest
      ? lessons.filter((l) => previewIds.includes(l.id))
      : lessons;
    const pending = allowed.filter((l) => !done.has(l.id));
    const last = progress
      .filter(
        (p: any) =>
          p.status === 'IN_PROGRESS' &&
          pending.some((l) => l.id === Number(p.lesson_id)),
      )
      .sort(
        (a: any, b: any) =>
          new Date(b.last_viewed_at ?? b.updated_at).getTime() -
          new Date(a.last_viewed_at ?? a.updated_at).getTime(),
      )[0];
    const completed =
      !actor.isGuest &&
      (lessons.length > 0 || quizzes.length > 0) &&
      lessons.every((l) => done.has(l.id)) &&
      quizzes.every((q: any) => q.passed);
    const started =
      progress.some((p: any) => p.status !== 'NOT_STARTED') ||
      quizzes.some((q: any) => q.attempted);
    const review =
      allowed.find(
        (l) =>
          !/^00\s*[·.:_-]|hướng dẫn bắt đầu|hướng dẫn học khóa học|đề cương/i.test(
            l.title,
          ),
      ) ?? allowed[0];
    const target = completed
      ? review
      : last
        ? allowed.find((l) => l.id === Number(last.lesson_id))
        : pending[0];
    const quiz =
      !actor.isGuest && !target ? quizzes.find((q: any) => !q.passed) : null;
    return {
      state: completed ? 'COMPLETED' : started ? 'IN_PROGRESS' : 'NEW',
      lessonId: target?.id ?? (!quiz ? review?.id : null) ?? null,
      quizId: quiz ? Number(quiz.quiz_id) : null,
      completedLessonIds: lessons
        .filter((l) => done.has(l.id))
        .map((l) => l.id),
      completedQuizIds: quizzes
        .filter((q: any) => q.passed)
        .map((q: any) => Number(q.quiz_id)),
      completedLessons: lessons.filter((l) => done.has(l.id)).length,
      totalLessons: lessons.length,
      isPreview: !!actor.isGuest,
    };
  }
  async classroom(actor: Actor, courseId: number) {
    await this.access.study(actor, courseId);
    const course = await this.courses.findOne(courseId);
    if (actor.isGuest) {
      const preview = course.sections
        .flatMap((s) => s.lessons)
        .filter((l) => l.id > 0)
        .slice(0, 2)
        .map((l) => l.id);
      course.sections = course.sections
        .map((s) => ({
          ...s,
          lessons: s.lessons.filter(
            (l: { id: number; type: string }) =>
              preview.includes(l.id) && l.type !== 'quiz',
          ),
        }))
        .filter((s) => s.lessons.length);
    }
    const progress: any[] = await this.db.query(
      `SELECT p.*,v.ranges,v.position_seconds,v.actual_seconds,v.duration_seconds FROM learning.lesson_progress p LEFT JOIN learning.video_state v USING(student_id,lesson_id) WHERE p.student_id=$1 AND p.course_id=$2`,
      [actor.userId, courseId],
    );
    const resources: any[] = await this.db.query(
      `SELECT r.* FROM lms.lesson_resources r JOIN lms.lessons l USING(lesson_id) WHERE l.course_id=$1 ORDER BY r.resource_id`,
      [courseId],
    );
    for (const section of course.sections)
      for (const lesson of section.lessons) {
        const p = progress.find((x) => Number(x.lesson_id) === lesson.id);
        lesson.completed = p?.status === 'COMPLETED';
        const list = await Promise.all(
          resources
            .filter((r) => Number(r.lesson_id) === lesson.id)
            .map(async (r) => ({
              id: Number(r.resource_id),
              title: r.title,
              type: r.resource_type,
              url: await this.resourceUrl(r, actor),
            })),
        );
        Object.assign(lesson, { progress: p ?? null, resources: list });
        const video = [...list].reverse().find((r) => r.type === 'VIDEO');
        if (video) {
          lesson.videoUrl = video.url;
          lesson.type = 'video';
        }
      }
    if (!actor.isGuest) {
      try {
        Object.assign(course, {
          recommendations: await this.recommendations.recommend(
            actor,
            courseId,
          ),
        });
      } catch {
        Object.assign(course, {
          recommendationNote:
            'Tạm thời chưa có gợi ý. Tiến độ học vẫn được lưu bình thường.',
        });
      }
    }
    const pedagogy: any[] = await this.db.query(
      'SELECT m.* FROM lms.lesson_pedagogy m JOIN lms.lessons l USING(lesson_id) WHERE l.course_id=$1',
      [courseId],
    );
    for (const s of course.sections)
      for (const l of s.lessons)
        Object.assign(l, {
          pedagogy: pedagogy.find((m) => Number(m.lesson_id) === l.id) ?? null,
        });
    return course;
  }
  private async resourceUrl(r: any, actor: Actor) {
    if (!r.resource_url.startsWith('vedu-file:')) return r.resource_url;
    const ticket = await this.jwt.signAsync(
      {
        sub: actor.userId,
        sessionId: actor.sessionId,
        type: 'media',
        resourceId: Number(r.resource_id),
      },
      { expiresIn: 3600 },
    );
    return `/api/platform/media/${r.resource_id}?ticket=${ticket}`;
  }
  async media(actor: Actor, resourceId: number) {
    const [r] = await this.db.query(
      `SELECT r.*,l.course_id FROM lms.lesson_resources r JOIN lms.lessons l USING(lesson_id) WHERE resource_id=$1 AND NOT l.is_deleted AND l.is_published`,
      [resourceId],
    );
    if (!r) throw new NotFoundException('Tài liệu không tồn tại');
    await this.access.study(actor, Number(r.course_id));
    await this.access.lesson(actor, Number(r.course_id), Number(r.lesson_id));
    const name = r.resource_url.replace('vedu-file:', '');
    if (!/^[a-f0-9-]{36}\.(mp4|pdf)$/.test(name))
      throw new BadRequestException('Tệp không hợp lệ');
    return {
      path: resolve(process.env.MEDIA_DIR || './media', name),
      type: name.endsWith('.pdf') ? 'application/pdf' : 'video/mp4',
    };
  }
  async addResource(
    actor: Actor,
    lessonId: number,
    data: any,
    file?: { buffer: Buffer },
  ) {
    const [l] = await this.db.query(
      'SELECT * FROM lms.lessons WHERE lesson_id=$1 AND NOT is_deleted',
      [lessonId],
    );
    if (!l) throw new NotFoundException('Bài học không tồn tại');
    await this.access.manageCourse(actor, Number(l.course_id));
    let type = String(data.type || 'DOCUMENT'),
      url = String(data.url || '');
    let videoDuration: number | null = null;
    if (file) {
      const pdf = file.buffer.subarray(0, 5).toString() === '%PDF-';
      const mp4 = file.buffer.subarray(4, 8).toString() === 'ftyp';
      if (!pdf && !mp4)
        throw new BadRequestException('Chỉ nhận PDF/MP4 hợp lệ, tối đa 100 MB');
      type = pdf ? 'PDF' : 'VIDEO';
      const dir = resolve(process.env.MEDIA_DIR || './media');
      await mkdir(dir, { recursive: true });
      const name = `${randomUUID()}.${pdf ? 'pdf' : 'mp4'}`;
      await writeFile(resolve(dir, name), file.buffer);
      if (mp4) {
        const { stdout } = await promisify(execFile)(
          process.env.FFPROBE_PATH || 'ffprobe',
          [
            '-v',
            'error',
            '-show_entries',
            'format=duration',
            '-of',
            'default=noprint_wrappers=1:nokey=1',
            resolve(dir, name),
          ],
          { timeout: 15000 },
        );
        videoDuration = Number(stdout.trim());
        if (
          !Number.isFinite(videoDuration) ||
          videoDuration <= 0 ||
          videoDuration > 86400
        )
          throw new BadRequestException(
            'Không đọc được thời lượng video hợp lệ',
          );
      }
      url = `vedu-file:${name}`;
    } else if (
      !/^https:\/\//i.test(url) ||
      !['VIDEO', 'PDF', 'DOCUMENT', 'LINK'].includes(type)
    )
      throw new BadRequestException(
        'URL phải dùng HTTPS và loại tài liệu hợp lệ',
      );
    if (
      typeof data.title !== 'string' ||
      data.title.trim().length < 2 ||
      data.title.length > 200
    )
      throw new BadRequestException('Tên tài liệu phải có 2-200 ký tự');
    return this.db.transaction(async (m) => {
      await m.query(
        'SELECT lesson_id FROM lms.lessons WHERE lesson_id=$1 FOR UPDATE',
        [lessonId],
      );
      const [r] = await m.query(
        `INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order) SELECT $1,$2,$3,$4,COALESCE(MAX(display_order),0)+1 FROM lms.lesson_resources WHERE lesson_id=$1 RETURNING *`,
        [lessonId, type, data.title.trim(), url],
      );
      await m.query(
        'UPDATE lms.lessons SET is_published=true,video_duration_seconds=COALESCE($2,video_duration_seconds),estimated_duration_seconds=CASE WHEN $2::numeric IS NOT NULL THEN CEIL($2)::int ELSE estimated_duration_seconds END WHERE lesson_id=$1',
        [lessonId, videoDuration],
      );
      return r;
    });
  }
  async courseContent(actor: Actor, courseId: number) {
    await this.access.manageCourse(actor, courseId);
    return {
      pedagogy: await this.db.query(
        'SELECT m.* FROM lms.lesson_pedagogy m JOIN lms.lessons l USING(lesson_id) WHERE l.course_id=$1',
        [courseId],
      ),
      sections: await this.db.query(
        'SELECT * FROM lms.course_sections WHERE course_id=$1 ORDER BY section_order',
        [courseId],
      ),
      lessons: await this.db.query(
        `SELECT l.*,COALESCE(jsonb_agg(r ORDER BY r.display_order) FILTER(WHERE r.resource_id IS NOT NULL),'[]') AS resources FROM lms.lessons l LEFT JOIN lms.lesson_resources r USING(lesson_id) WHERE l.course_id=$1 AND NOT l.is_deleted GROUP BY l.lesson_id ORDER BY lesson_order`,
        [courseId],
      ),
      quizzes: await this.db.query(
        'SELECT * FROM assessment.quizzes WHERE course_id=$1 AND NOT is_deleted',
        [courseId],
      ),
    };
  }
  async section(actor: Actor, courseId: number, title: string) {
    await this.access.manageCourse(actor, courseId);
    if (!title?.trim() || title.length > 200)
      throw new BadRequestException('Tên chương 1-200 ký tự');
    return this.db.transaction(async (m) => {
      await m.query(
        'SELECT course_id FROM lms.courses WHERE course_id=$1 FOR UPDATE',
        [courseId],
      );
      return (
        await m.query(
          'INSERT INTO lms.course_sections(course_id,title,section_order) SELECT $1,$2,COALESCE(MAX(section_order),0)+1 FROM lms.course_sections WHERE course_id=$1 RETURNING *',
          [courseId, title.trim()],
        )
      )[0];
    });
  }
  async editLesson(actor: Actor, id: number, data: any) {
    const [l] = await this.db.query(
      'SELECT * FROM lms.lessons WHERE lesson_id=$1 AND NOT is_deleted',
      [id],
    );
    if (!l) throw new NotFoundException();
    await this.access.manageCourse(actor, Number(l.course_id));
    if (
      typeof data.title !== 'string' ||
      !data.title.trim() ||
      data.title.length > 220 ||
      typeof data.content !== 'string' ||
      data.content.length > 100000 ||
      !Number.isInteger(Number(data.durationSeconds)) ||
      Number(data.durationSeconds) < 0 ||
      Number(data.durationSeconds) > 86400 ||
      typeof data.isPublished !== 'boolean'
    )
      throw new BadRequestException(
        'Tên/nội dung/thời lượng bài học không hợp lệ',
      );
    if (data.sectionId) {
      const [s] = await this.db.query(
        'SELECT 1 FROM lms.course_sections WHERE section_id=$1 AND course_id=$2',
        [data.sectionId, l.course_id],
      );
      if (!s) throw new BadRequestException('Chương không thuộc khóa học');
    }
    await this.db.query(
      'UPDATE lms.lessons SET title=$2,content=$3,estimated_duration_seconds=COALESCE(CEIL(video_duration_seconds)::int,$4),is_published=$5,section_id=$6 WHERE lesson_id=$1',
      [
        id,
        data.title.trim(),
        data.content,
        Number(data.durationSeconds),
        data.isPublished,
        data.sectionId || null,
      ],
    );
    return (
      await this.db.query('SELECT * FROM lms.lessons WHERE lesson_id=$1', [id])
    )[0];
  }
  async archiveLesson(actor: Actor, id: number) {
    const [l] = await this.db.query(
      'SELECT course_id FROM lms.lessons WHERE lesson_id=$1',
      [id],
    );
    if (!l) throw new NotFoundException();
    await this.access.manageCourse(actor, Number(l.course_id));
    await this.db.query(
      'UPDATE lms.lessons SET is_deleted=true,deleted_at=now(),is_published=false WHERE lesson_id=$1',
      [id],
    );
    return { message: 'Đã lưu trữ bài học, không xóa lịch sử học' };
  }
  async reorder(actor: Actor, courseId: number, ids: number[]) {
    await this.access.manageCourse(actor, courseId);
    if (
      !Array.isArray(ids) ||
      !ids.length ||
      ids.length > 1000 ||
      new Set(ids).size !== ids.length
    )
      throw new BadRequestException('Danh sách thứ tự không hợp lệ');
    return this.db.transaction(async (m) => {
      await m.query(
        'SELECT course_id FROM lms.courses WHERE course_id=$1 FOR UPDATE',
        [courseId],
      );
      const all: any[] = await m.query(
        'SELECT lesson_id,lesson_order FROM lms.lessons WHERE course_id=$1 ORDER BY lesson_order FOR UPDATE',
        [courseId],
      );
      const live: any[] = await m.query(
        'SELECT lesson_id FROM lms.lessons WHERE course_id=$1 AND NOT is_deleted',
        [courseId],
      );
      if (
        ids.length !== live.length ||
        ids.some((id) => !live.some((l) => Number(l.lesson_id) === Number(id)))
      )
        throw new BadRequestException(
          'Cần gửi đúng toàn bộ bài học đang hoạt động',
        );
      const complete = [
        ...ids,
        ...all
          .filter((l) => !ids.map(Number).includes(Number(l.lesson_id)))
          .map((l) => Number(l.lesson_id)),
      ];
      const offset = Math.max(...all.map((l) => Number(l.lesson_order))) + 1000;
      await m.query(
        'UPDATE lms.lessons SET lesson_order=lesson_order+$2 WHERE course_id=$1',
        [courseId, offset],
      );
      for (const [i, id] of complete.entries())
        await m.query(
          'UPDATE lms.lessons SET lesson_order=$2 WHERE lesson_id=$1',
          [id, i + 1],
        );
      return { message: 'Đã lưu thứ tự bài học' };
    });
  }
  async assignment(
    actor: Actor,
    courseId: number,
    teacherId: number,
    remove = false,
  ) {
    if (actor.role !== 'ADMIN')
      throw new ForbiddenException('Chỉ quản trị phân công giảng viên');
    await this.access.manageCourse(actor, courseId);
    const [teacher] = await this.db.query(
      "SELECT 1 FROM auth.users WHERE user_id=$1 AND role='TEACHER' AND is_active",
      [teacherId],
    );
    if (!teacher)
      throw new BadRequestException('Tài khoản giảng viên không hợp lệ');
    await this.db.transaction(async (m) => {
      if (remove)
        await m.query(
          'DELETE FROM lms.course_teachers WHERE course_id=$1 AND teacher_id=$2',
          [courseId, teacherId],
        );
      else
        await m.query(
          'INSERT INTO lms.course_teachers(course_id,teacher_id,assigned_by) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',
          [courseId, teacherId, actor.userId],
        );
      const [course] = await m.query(
        'SELECT course_name FROM lms.courses WHERE course_id=$1',
        [courseId],
      );
      await m.query(
        `INSERT INTO auth.notifications(user_id,title,body,route) VALUES($1,$2,$3,$4)`,
        [
          teacherId,
          remove
            ? 'Đã gỡ phân công khóa học'
            : 'Bạn được phân công khóa học mới',
          `${course.course_name}. ${remove ? 'Quyền hỗ trợ khóa học đã kết thúc.' : 'Mở Nội dung & học liệu hoặc Hỏi đáp khóa học để hỗ trợ học viên.'}`,
          remove ? '/teacher/courses' : '/teacher/content',
        ],
      );
    });
    return {
      message: remove
        ? 'Đã gỡ phân công'
        : 'Đã phân công và gửi thông báo cho giảng viên',
    };
  }
  notifications(actor: Actor) {
    return this.db.query(
      `SELECT notification_id AS id,title,body,route,read_at AS "readAt",created_at AS "createdAt" FROM auth.notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`,
      [actor.userId],
    );
  }
  async readNotification(actor: Actor, id: number) {
    const rows = await this.db.query(
      'WITH updated AS (UPDATE auth.notifications SET read_at=COALESCE(read_at,now()) WHERE notification_id=$1 AND user_id=$2 RETURNING notification_id) SELECT * FROM updated',
      [id, actor.userId],
    );
    if (!rows.length) throw new NotFoundException('Không tìm thấy thông báo');
    return { message: 'Đã đọc thông báo' };
  }
  async moderation(actor: Actor) {
    if (actor.role !== 'ADMIN') throw new ForbiddenException();
    return this.db
      .query(`SELECT c.course_id AS id,c.course_name AS title,c.description,c.status,c.review_status AS "reviewStatus",c.review_note AS "reviewNote",u.full_name AS instructor,
      (SELECT count(*)::int FROM lms.lessons l WHERE l.course_id=c.course_id AND NOT l.is_deleted) AS lessons,
      (SELECT count(*)::int FROM lms.lessons l WHERE l.course_id=c.course_id AND NOT l.is_deleted AND l.is_published) AS "publishedLessons",
      COALESCE((SELECT jsonb_agg(jsonb_build_object('decision',r.decision,'note',r.note,'at',r.created_at,'reviewer',a.full_name) ORDER BY r.created_at DESC) FROM lms.content_reviews r JOIN auth.users a ON a.user_id=r.reviewer_id WHERE r.course_id=c.course_id),'[]') AS history
      FROM lms.courses c JOIN auth.users u ON u.user_id=c.teacher_id WHERE NOT c.is_deleted ORDER BY (c.review_status='PENDING') DESC,c.updated_at DESC`);
  }
  async review(
    actor: Actor,
    id: number,
    data: { decision: string; note: string },
  ) {
    if (actor.role !== 'ADMIN') throw new ForbiddenException();
    if (
      !['APPROVED', 'CHANGES_REQUESTED', 'HIDDEN'].includes(data.decision) ||
      !data.note?.trim() ||
      data.note.length > 2000
    )
      throw new BadRequestException(
        'Chọn quyết định và nhập nhận xét 1–2000 ký tự',
      );
    return this.db.transaction(async (m) => {
      const [c] = await m.query(
        'SELECT * FROM lms.courses WHERE course_id=$1 AND NOT is_deleted FOR UPDATE',
        [id],
      );
      if (!c) throw new NotFoundException('Khóa học không tồn tại');
      if (data.decision === 'APPROVED') {
        const [ready] = await m.query(
          'SELECT count(*)::int n FROM lms.lessons WHERE course_id=$1 AND is_published AND NOT is_deleted',
          [id],
        );
        if (!ready.n)
          throw new BadRequestException(
            'Cần ít nhất một bài học đã công bố trước khi duyệt',
          );
      }
      await m.query(
        'UPDATE lms.courses SET status=$2,review_status=$3,review_note=$4,updated_at=now() WHERE course_id=$1',
        [
          id,
          data.decision === 'APPROVED'
            ? 'PUBLISHED'
            : data.decision === 'HIDDEN'
              ? 'ARCHIVED'
              : 'DRAFT',
          data.decision,
          data.note.trim(),
        ],
      );
      await m.query(
        'INSERT INTO lms.content_reviews(course_id,reviewer_id,decision,note) VALUES($1,$2,$3,$4)',
        [id, actor.userId, data.decision, data.note.trim()],
      );
      await m.query(
        `INSERT INTO auth.notifications(user_id,title,body,route) SELECT teacher_id,'Kết quả kiểm duyệt khóa học',$2,'/teacher/courses' FROM lms.courses WHERE course_id=$1 UNION SELECT teacher_id,'Kết quả kiểm duyệt khóa học',$2,'/teacher/courses' FROM lms.course_teachers WHERE course_id=$1`,
        [id, `${c.course_name}: ${data.decision}. ${data.note.trim()}`],
      );
      return { message: 'Đã lưu quyết định kiểm duyệt và gửi thông báo' };
    });
  }
  async assignments(actor: Actor) {
    if (actor.role !== 'ADMIN') throw new ForbiddenException();
    return {
      teachers: await this.db.query(
        "SELECT user_id,full_name FROM auth.users WHERE role='TEACHER' AND is_active",
      ),
      courses: await this.db.query(
        'SELECT course_id,course_name,teacher_id FROM lms.courses WHERE NOT is_deleted',
      ),
      assignments: await this.db.query('SELECT * FROM lms.course_teachers'),
    };
  }
  async questions(actor: Actor, courseId: number) {
    await this.access.study(actor, courseId);
    return this.db.query(
      `SELECT q.*,u.full_name,COALESCE((SELECT jsonb_agg(jsonb_build_object('id',m.message_id,'body',m.body,'author',a.full_name,'role',a.role,'createdAt',m.created_at) ORDER BY m.created_at,m.message_id) FROM lms.course_messages m JOIN auth.users a ON a.user_id=m.author_id WHERE m.question_id=q.question_id),'[]') AS messages FROM lms.course_questions q JOIN auth.users u ON u.user_id=q.author_id WHERE course_id=$1 ORDER BY q.created_at DESC`,
      [courseId],
    );
  }
  async ask(actor: Actor, courseId: number, subject: string, body: string) {
    await this.access.study(actor, courseId);
    if (
      !subject?.trim() ||
      subject.length > 200 ||
      !body?.trim() ||
      body.length > 5000
    )
      throw new BadRequestException('Tiêu đề 1-200 và nội dung 1-5000 ký tự');
    return this.db.transaction(async (m) => {
      const [q] = await m.query(
        'INSERT INTO lms.course_questions(course_id,author_id,subject) VALUES($1,$2,$3) RETURNING *',
        [courseId, actor.userId, subject.trim()],
      );
      await m.query(
        'INSERT INTO lms.course_messages(question_id,author_id,body) VALUES($1,$2,$3)',
        [q.question_id, actor.userId, body.trim()],
      );
      return q;
    });
  }
  async reply(actor: Actor, questionId: number, body: string) {
    const [q] = await this.db.query(
      'SELECT * FROM lms.course_questions WHERE question_id=$1',
      [questionId],
    );
    if (!q) throw new NotFoundException();
    await this.access.study(actor, Number(q.course_id));
    if (!body?.trim() || body.length > 5000)
      throw new BadRequestException('Nội dung 1-5000 ký tự');
    await this.db.query(
      'INSERT INTO lms.course_messages(question_id,author_id,body) VALUES($1,$2,$3)',
      [questionId, actor.userId, body.trim()],
    );
    return { message: 'Đã gửi trả lời' };
  }
  async ticket(actor: Actor, id: number) {
    const [t] = await this.db.query(
      'SELECT * FROM support.tickets WHERE ticket_id=$1',
      [id],
    );
    if (
      !t ||
      (actor.role !== 'ADMIN' &&
        Number(t.student_id) !== actor.userId &&
        Number(t.assigned_to) !== actor.userId)
    )
      throw new ForbiddenException('Không được truy cập ticket');
    return {
      ...t,
      messages: await this.db.query(
        'SELECT m.*,u.full_name FROM support.ticket_messages m JOIN auth.users u ON u.user_id=m.sender_id WHERE ticket_id=$1 ORDER BY created_at',
        [id],
      ),
    };
  }
  async tickets(actor: Actor) {
    return this.db.query(
      `SELECT ticket_id AS "ticketId",subject,status,assigned_to AS "assignedTo" FROM support.tickets WHERE $1='ADMIN' OR student_id=$2 OR assigned_to=$2 ORDER BY updated_at DESC LIMIT 100`,
      [actor.role, actor.userId],
    );
  }
  async updateTicket(actor: Actor, id: number, data: any) {
    await this.ticket(actor, id);
    return this.db.transaction(async (m) => {
      if (data.status || data.assignedTo !== undefined) {
        if (actor.role === 'STUDENT')
          throw new ForbiddenException('Học viên chỉ gửi hội thoại');
        if (data.assignedTo !== undefined && actor.role !== 'ADMIN')
          throw new ForbiddenException('Chỉ admin phân công ticket');
        if (
          data.status &&
          !['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(data.status)
        )
          throw new BadRequestException('Trạng thái không hợp lệ');
        await m.query(
          `UPDATE support.tickets SET status=COALESCE($2,status),assigned_to=CASE WHEN $3 THEN $4 ELSE assigned_to END,resolved_at=CASE WHEN COALESCE($2,status) IN ('RESOLVED','CLOSED') THEN COALESCE(resolved_at,now()) ELSE NULL END WHERE ticket_id=$1`,
          [
            id,
            data.status ?? null,
            data.assignedTo !== undefined,
            data.assignedTo ?? null,
          ],
        );
      }
      if (data.message) {
        if (typeof data.message !== 'string' || data.message.length > 5000)
          throw new BadRequestException('Nội dung quá dài');
        await m.query(
          'INSERT INTO support.ticket_messages(ticket_id,sender_id,message_text) VALUES($1,$2,$3)',
          [id, actor.userId, data.message],
        );
      }
      return { message: 'Đã cập nhật ticket' };
    });
  }
  async issueCertificate(actor: Actor, courseId: number) {
    const e = await this.access.study(actor, courseId);
    if (actor.role !== 'STUDENT') throw new ForbiddenException();
    return this.db.transaction(async (m) => {
      await m.query(
        'SELECT enrollment_id FROM enrollment.enrollments WHERE enrollment_id=$1 FOR UPDATE',
        [e.enrollment_id],
      );
      const [missing] = await m.query(
        `SELECT count(*)::int n FROM lms.lessons l WHERE course_id=$1 AND is_published AND NOT is_deleted AND NOT EXISTS(SELECT 1 FROM learning.lesson_progress p WHERE p.lesson_id=l.lesson_id AND p.student_id=$2 AND p.status='COMPLETED')`,
        [courseId, actor.userId],
      );
      const [total] = await m.query(
        'SELECT count(*)::int n FROM lms.lessons WHERE course_id=$1 AND is_published AND NOT is_deleted',
        [courseId],
      );
      const [failed] = await m.query(
        `SELECT count(*)::int n FROM assessment.quizzes q WHERE course_id=$1 AND is_published AND NOT is_deleted AND NOT EXISTS(SELECT 1 FROM assessment.quiz_attempts a WHERE a.quiz_id=q.quiz_id AND a.student_id=$2 AND a.status IN ('GRADED','SUBMITTED') AND a.score>=q.passing_score)`,
        [courseId, actor.userId],
      );
      if (!total.n || missing.n || failed.n)
        throw new BadRequestException(
          `Cần hoàn thành tất cả bài học và đạt tất cả quiz. Còn ${missing.n} bài học, ${failed.n} quiz chưa đạt.`,
        );
      await m.query(
        "UPDATE enrollment.enrollments SET status='COMPLETED',completed_at=COALESCE(completed_at,now()) WHERE enrollment_id=$1",
        [e.enrollment_id],
      );
      const [c] = await m.query(
        'SELECT lms.fn_issue_certificate($1::bigint,NULL) AS id',
        [e.enrollment_id],
      );
      return (
        await m.query(
          'SELECT certificate_code FROM lms.certificates WHERE certificate_id=$1',
          [c.id],
        )
      )[0];
    });
  }
  async certificate(code: string, actor?: Actor) {
    const [c] = await this.db.query(
      `SELECT c.*,u.full_name,co.course_name FROM lms.certificates c JOIN auth.users u ON u.user_id=c.student_id JOIN lms.courses co USING(course_id) WHERE certificate_code=$1`,
      [code],
    );
    if (!c) throw new NotFoundException('Mã chứng nhận không tồn tại');
    if (
      actor &&
      actor.role !== 'ADMIN' &&
      Number(c.student_id) !== actor.userId
    )
      throw new ForbiddenException();
    return c;
  }
  async report(actor: Actor, query: any) {
    if (!['ADMIN', 'TEACHER'].includes(actor.role))
      throw new ForbiddenException();
    if (
      (query.from && !Number.isFinite(Date.parse(query.from))) ||
      (query.to && !Number.isFinite(Date.parse(query.to)))
    )
      throw new BadRequestException('Ngày lọc không hợp lệ');
    const courseId = query.courseId ? Number(query.courseId) : null;
    if (courseId && !Number.isInteger(courseId))
      throw new BadRequestException('Mã khóa học không hợp lệ');
    return this.db.query(
      `SELECT e.enrollment_id,c.course_name,u.full_name,u.username,e.enrolled_at,e.status,
      COALESCE(o.status,'NO_ORDER') AS payment_status,e.final_price,
      (SELECT count(*) FROM learning.lesson_progress p WHERE p.student_id=e.student_id AND p.course_id=e.course_id AND p.status='COMPLETED')::int AS completed_lessons,
      (SELECT COALESCE(sum(p.watch_duration_seconds),0) FROM learning.lesson_progress p WHERE p.student_id=e.student_id AND p.course_id=e.course_id)::int AS actual_seconds,
      (SELECT max(score) FROM assessment.quiz_attempts a WHERE a.course_id=e.course_id AND a.student_id=e.student_id AND status='GRADED') AS best_score
      FROM enrollment.enrollments e JOIN lms.courses c USING(course_id) JOIN auth.users u ON u.user_id=e.student_id LEFT JOIN payment.orders o USING(enrollment_id)
      WHERE ($1::bigint IS NULL OR e.course_id=$1) AND ($2::timestamptz IS NULL OR e.enrolled_at>=$2)
      AND ($3::timestamptz IS NULL OR e.enrolled_at<$3::timestamptz+interval '1 day')
      AND ($4='ADMIN' OR c.teacher_id=$5 OR EXISTS(SELECT 1 FROM lms.course_teachers t WHERE t.course_id=c.course_id AND t.teacher_id=$5))
      ORDER BY e.enrolled_at DESC LIMIT 10000`,
      [
        courseId,
        query.from || null,
        query.to || null,
        actor.role,
        actor.userId,
      ],
    );
  }
  async createQuiz(actor: Actor, courseId: number, data: any) {
    await this.access.manageCourse(actor, courseId);
    if (
      !data.title?.trim() ||
      data.title.length > 200 ||
      !Number.isInteger(Number(data.timeLimitSeconds)) ||
      Number(data.timeLimitSeconds) < 10 ||
      Number(data.timeLimitSeconds) > 86400 ||
      !Array.isArray(data.questions) ||
      data.questions.length < 1 ||
      data.questions.length > 100 ||
      !Number.isFinite(Number(data.passingScore ?? 5)) ||
      Number(data.passingScore ?? 5) < 0 ||
      Number(data.passingScore ?? 5) > 10
    )
      throw new BadRequestException(
        'Tên, thời gian (10-86400 giây), điểm đạt hoặc câu hỏi không hợp lệ',
      );
    return this.db.transaction(async (m) => {
      const [q] = await m.query(
        `INSERT INTO assessment.quizzes(course_id,title,time_limit_seconds,passing_score,max_attempts,is_published) VALUES($1,$2,$3,$4,$5,true) RETURNING *`,
        [
          courseId,
          data.title,
          Number(data.timeLimitSeconds),
          Number(data.passingScore ?? 5),
          Math.min(100, Math.max(1, Number(data.maxAttempts) || 3)),
        ],
      );
      for (const [index, item] of data.questions.entries()) {
        const type = item.type ?? 'SINGLE_CHOICE';
        if (
          !item.text?.trim() ||
          !['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(type) ||
          !Array.isArray(item.options) ||
          item.options.length < 2 ||
          item.options.length > 10 ||
          !item.options.some((o: any) => o.correct) ||
          (type !== 'MULTIPLE_CHOICE' &&
            item.options.filter((o: any) => o.correct).length !== 1)
        )
          throw new BadRequestException(
            'Câu hỏi cần ít nhất 2 lựa chọn và đáp án đúng hợp lệ',
          );
        const [question] = await m.query(
          'INSERT INTO assessment.questions(quiz_id,question_text,question_type,question_order,points) VALUES($1,$2,$3,$4,1) RETURNING question_id',
          [q.quiz_id, item.text, type, index + 1],
        );
        for (const [j, opt] of item.options.entries()) {
          if (!opt.text?.trim())
            throw new BadRequestException('Lựa chọn không được trống');
          await m.query(
            'INSERT INTO assessment.answers(question_id,answer_text,is_correct,answer_order) VALUES($1,$2,$3,$4)',
            [question.question_id, opt.text, opt.correct === true, j + 1],
          );
        }
      }
      return q;
    });
  }
  async openWatch(actor: Actor, lessonId: number) {
    const [l] = await this.db.query(
      'SELECT * FROM lms.lessons WHERE lesson_id=$1 AND is_published AND NOT is_deleted',
      [lessonId],
    );
    if (!l) throw new NotFoundException();
    await this.access.lesson(actor, Number(l.course_id), lessonId);
    const [r] = await this.db.query(
      "SELECT 1 FROM lms.lesson_resources WHERE lesson_id=$1 AND resource_type='VIDEO'",
      [lessonId],
    );
    if (!r) throw new BadRequestException('Bài học không có video');
    return this.db.transaction(async (m) => {
      await m.query(
        'INSERT INTO learning.video_state(student_id,lesson_id) VALUES($1,$2) ON CONFLICT DO NOTHING',
        [actor.userId, lessonId],
      );
      const [state] = await m.query(
        'SELECT * FROM learning.video_state WHERE student_id=$1 AND lesson_id=$2 FOR UPDATE',
        [actor.userId, lessonId],
      );
      // A single playback session prevents double counting from multiple tabs/devices.
      await m.query(
        'UPDATE learning.watch_sessions SET expires_at=now() WHERE student_id=$1',
        [actor.userId],
      );
      const watchId = randomUUID();
      await m.query(
        'INSERT INTO learning.watch_sessions(watch_id,student_id,lesson_id,last_position) VALUES($1,$2,$3,$4)',
        [watchId, actor.userId, lessonId, state.position_seconds],
      );
      return { watchId, state };
    });
  }
  async heartbeat(actor: Actor, data: any) {
    const pos = Number(data.positionSeconds),
      duration = Number(data.durationSeconds),
      rate = Number(data.playbackRate ?? 1);
    if (
      !Number.isFinite(pos) ||
      !Number.isFinite(duration) ||
      duration <= 0 ||
      duration > 86400 ||
      pos < 0 ||
      pos > duration + 1 ||
      rate < 0.25 ||
      rate > 4 ||
      !/^[a-f0-9-]{36}$/i.test(data.eventId ?? '')
    )
      throw new BadRequestException('Thông tin video không hợp lệ');
    const [ctx] = await this.db.query(
      'SELECT l.course_id,l.lesson_id,l.video_duration_seconds FROM learning.watch_sessions w JOIN lms.lessons l USING(lesson_id) WHERE w.watch_id=$1 AND w.student_id=$2',
      [data.watchId, actor.userId],
    );
    if (!ctx) throw new ForbiddenException();
    await this.access.study(actor, Number(ctx.course_id));
    await this.access.lesson(
      actor,
      Number(ctx.course_id),
      Number(ctx.lesson_id),
    );
    if (
      ctx.video_duration_seconds &&
      Math.abs(Number(ctx.video_duration_seconds) - duration) > 2
    )
      throw new BadRequestException(
        'Thời lượng không khớp video gốc được đo bằng ffprobe',
      );
    return this.db.transaction(async (m) => {
      const [w] = await m.query(
        'SELECT * FROM learning.watch_sessions WHERE watch_id=$1 AND student_id=$2 FOR UPDATE',
        [data.watchId, actor.userId],
      );
      const [receipt] = await m.query(
        'SELECT result FROM learning.watch_receipts WHERE event_id=$1 AND watch_id=$2',
        [data.eventId, data.watchId],
      );
      if (receipt) return receipt.result;
      if (!w || new Date(w.expires_at).getTime() < Date.now())
        throw new BadRequestException(
          'Phiên xem đã hết hạn hoặc được mở ở thiết bị khác',
        );
      const [v] = await m.query(
        'SELECT * FROM learning.video_state WHERE student_id=$1 AND lesson_id=$2 FOR UPDATE',
        [actor.userId, w.lesson_id],
      );
      const elapsed = Math.min(
        8,
        Math.max(0, (Date.now() - new Date(w.last_seen).getTime()) / 1000),
      );
      const delta = pos - Number(w.last_position);
      const valid =
        data.playing === true &&
        data.seeking !== true &&
        delta > 0 &&
        delta <= elapsed * rate + 0.5;
      const actual = valid ? Math.min(elapsed, delta / rate) : 0;
      const ranges: number[][] = valid
        ? [...v.ranges, [Number(w.last_position), pos]].sort(
            (a, b) => a[0] - b[0],
          )
        : v.ranges;
      const merged: number[][] = [];
      for (const range of ranges) {
        const last = merged.at(-1);
        if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
        else merged.push([...range]);
      }
      const unique = merged.reduce((sum, r) => sum + r[1] - r[0], 0),
        percent = Math.min(100, Math.floor((unique / duration) * 100));
      if (
        Number(v.duration_seconds) > 0 &&
        Math.abs(Number(v.duration_seconds) - duration) > 2
      )
        throw new BadRequestException(
          'Thời lượng video thay đổi. Liên hệ giảng viên để đặt lại tiến độ',
        );
      await m.query(
        'UPDATE learning.watch_sessions SET last_position=$2,last_seen=now() WHERE watch_id=$1',
        [data.watchId, pos],
      );
      await m.query(
        'UPDATE learning.video_state SET ranges=$3,position_seconds=$4,actual_seconds=actual_seconds+$5,duration_seconds=$6,updated_at=now() WHERE student_id=$1 AND lesson_id=$2',
        [
          actor.userId,
          w.lesson_id,
          JSON.stringify(merged),
          pos,
          actual,
          duration,
        ],
      );
      await m.query(
        `INSERT INTO learning.lesson_progress(student_id,course_id,lesson_id,status,progress_percent,watch_duration_seconds,first_viewed_at,last_viewed_at,completed_at)
       VALUES($1,$2,$3,$4::varchar,$5,$6,now(),now(),CASE WHEN $4::varchar='COMPLETED' THEN now() END)
       ON CONFLICT(student_id,lesson_id) DO UPDATE SET status=EXCLUDED.status,progress_percent=EXCLUDED.progress_percent,watch_duration_seconds=EXCLUDED.watch_duration_seconds,last_viewed_at=now(),completed_at=COALESCE(learning.lesson_progress.completed_at,EXCLUDED.completed_at)`,
        [
          actor.userId,
          ctx.course_id,
          w.lesson_id,
          percent >= 85 ? 'COMPLETED' : 'IN_PROGRESS',
          percent,
          Math.floor(Number(v.actual_seconds) + actual),
        ],
      );
      if (actual >= 1)
        await m.query(
          `SELECT learning.fn_log_learning_event($1::uuid,$2::bigint,$3::bigint,$4::bigint,NULL,NULL,$5::uuid,'VIEW_LESSON',now(),NULL,0,'IN_PROGRESS','WEB','REAL',$6::jsonb)`,
          [
            data.eventId,
            actor.userId,
            ctx.course_id,
            w.lesson_id,
            data.watchId,
            JSON.stringify({
              verifiedActualSeconds: actual,
              uniqueSeconds: unique,
              serverClock: true,
            }),
          ],
        );
      const result = {
        actualSeconds: Math.floor(Number(v.actual_seconds) + actual),
        uniqueSeconds: Math.floor(unique),
        percent,
        completed: percent >= 85,
        positionSeconds: pos,
        durationSeconds: Math.ceil(duration),
      };
      await m.query(
        'INSERT INTO learning.watch_receipts(event_id,watch_id,result) VALUES($1,$2,$3)',
        [data.eventId, data.watchId, JSON.stringify(result)],
      );
      return result;
    });
  }
}
