import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
export type Actor = {
  userId: number;
  role: string;
  sessionId?: string;
  isGuest?: boolean;
};
@Injectable()
export class AccessService {
  constructor(private readonly db: DataSource) {}
  async manageCourse(actor: Actor, courseId: number) {
    const [course] = await this.db.query(
      `SELECT * FROM lms.courses WHERE course_id=$1 AND NOT is_deleted`,
      [courseId],
    );
    if (!course) throw new NotFoundException('Khóa học không tồn tại');
    if (actor.role === 'ADMIN') return course;
    const assigned = await this.db.query(
      `SELECT 1 FROM lms.course_teachers WHERE course_id=$1 AND teacher_id=$2`,
      [courseId, actor.userId],
    );
    if (
      actor.role !== 'TEACHER' ||
      (Number(course.teacher_id) !== actor.userId && !assigned.length)
    )
      throw new ForbiddenException('Không được phân công quản lý khóa học này');
    return course;
  }
  async study(actor: Actor, courseId: number) {
    if (actor.role !== 'STUDENT') return this.manageCourse(actor, courseId);
    const [row] = await this.db.query(
      `SELECT e.*, c.status AS course_status,c.price AS course_price FROM enrollment.enrollments e
      JOIN lms.courses c USING(course_id) WHERE e.course_id=$1 AND e.student_id=$2 AND NOT c.is_deleted
      AND e.status IN ('ACTIVE','COMPLETED') AND (e.final_price=0 OR EXISTS(
        SELECT 1 FROM payment.orders o WHERE o.enrollment_id=e.enrollment_id AND o.status='PAID'))`,
      [courseId, actor.userId],
    );
    if (!row || row.course_status !== 'PUBLISHED')
      throw new ForbiddenException(
        'Cần ghi danh và thanh toán khóa học trước khi học',
      );
    if (actor.isGuest && Number(row.course_price) > 0)
      throw new ForbiddenException('Khách chỉ được học thử khóa miễn phí');
    return row;
  }
  
async lesson(actor: Actor, courseId: number, lessonId: number) {
  await this.study(actor, courseId);

  const lessons: { lesson_id: number }[] = await this.db.query(
    `SELECT lesson_id
     FROM lms.lessons
     WHERE course_id = $1
       AND is_published = TRUE
       AND NOT is_deleted
     ORDER BY lesson_order, lesson_id`,
    [courseId],
  );

  const index = lessons.findIndex(
    (l) => Number(l.lesson_id) === Number(lessonId),
  );

  if (index === -1) {
    throw new ForbiddenException(
      'Bài học không tồn tại hoặc chưa được công bố',
    );
  }

  // Giảng viên/Admin được quản lý khóa học theo quyền đã kiểm tra.
  if (actor.role !== 'STUDENT') return;

  // Giữ chính sách học thử tối đa 2 bài hiện có.
  if (actor.isGuest) {
    if (index >= 2) {
      throw new ForbiddenException(
        'Khách chỉ được học thử 2 bài đầu mỗi khóa.',
      );
    }
    return;
  }

  // Bài đầu tiên luôn được mở cho học viên đã ghi danh.
  if (index === 0) return;

  // Các bài trước phải có ít nhất một lượt quiz đạt.
  const previousIds = lessons
    .slice(0, index)
    .map((l) => Number(l.lesson_id));

  const passedRows: { lesson_id: number }[] =
    await this.db.query(
      `SELECT DISTINCT q.lesson_id
       FROM assessment.quizzes q
       JOIN assessment.quiz_attempts a
         ON a.quiz_id = q.quiz_id
       WHERE q.course_id = $1
         AND q.lesson_id = ANY($2::bigint[])
         AND q.is_published = TRUE
         AND NOT q.is_deleted
         AND a.student_id = $3
         AND a.status = 'GRADED'
         AND a.score >= q.passing_score`,
      [courseId, previousIds, actor.userId],
    );

  const passedIds = new Set(
    passedRows.map((r) => Number(r.lesson_id)),
  );

  const missingIndex = previousIds.findIndex(
    (id) => !passedIds.has(id),
  );

  if (missingIndex !== -1) {
    throw new ForbiddenException(
      `Cần đạt quiz Bài ${missingIndex + 1} trước khi học bài tiếp theo.`,
    );
  }
}

}
