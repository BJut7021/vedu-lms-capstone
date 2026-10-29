import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AccessService, Actor } from '../auth/access.service';

@Injectable()
export class ExamService {
  constructor(
    private readonly db: DataSource,
    private readonly access: AccessService,
  ) {}
  async start(quizId: number, actor: Actor) {
    const [quiz] = await this.db.query(
      'SELECT * FROM assessment.quizzes WHERE quiz_id=$1 AND is_published AND NOT is_deleted',
      [quizId],
    );
    if (!quiz) throw new NotFoundException('Bài thi chưa được công bố');
    if (actor.role !== 'STUDENT')
      throw new BadRequestException('Chỉ học viên có bài làm');
    await this.access.study(actor, Number(quiz.course_id));
    if (!quiz.lesson_id && quiz.title.startsWith('Thi cuối khóa —')) {
      const [missing] = await this.db.query(
        `SELECT count(*)::int n FROM lms.lessons l WHERE course_id=$1 AND is_published AND NOT is_deleted AND NOT EXISTS(SELECT 1 FROM learning.lesson_progress p WHERE p.student_id=$2 AND p.lesson_id=l.lesson_id AND p.status='COMPLETED')`,
        [quiz.course_id, actor.userId],
      );
      if (missing.n)
        throw new BadRequestException(
          `Hoàn thành ${missing.n} bài học còn lại trước khi thi cuối khóa`,
        );
    }
    return this.db.transaction(async (m) => {
      await m.query('SELECT pg_advisory_xact_lock($1::integer,$2::integer)', [
        actor.userId,
        quizId,
      ]);
      let [a] = await m.query(
        `SELECT * FROM assessment.quiz_attempts WHERE quiz_id=$1 AND student_id=$2 AND status='IN_PROGRESS'`,
        [quizId, actor.userId],
      );
      if (!a) {
        const [count] = await m.query(
          'SELECT count(*)::int n FROM assessment.quiz_attempts WHERE quiz_id=$1 AND student_id=$2',
          [quizId, actor.userId],
        );
        if (count.n >= Number(quiz.max_attempts))
          throw new BadRequestException('Đã hết lượt làm bài');
        [a] = await m.query(
          `INSERT INTO assessment.quiz_attempts(quiz_id,course_id,student_id,attempt_no,status) VALUES($1,$2,$3,$4,'IN_PROGRESS') RETURNING *`,
          [quizId, quiz.course_id, actor.userId, count.n + 1],
        );
      }
      const [draft] = await m.query(
        'SELECT answers FROM assessment.attempt_drafts WHERE attempt_id=$1',
        [a.attempt_id],
      );
      return {
        attemptId: Number(a.attempt_id),
        startedAt: a.started_at,
        deadline: new Date(
          new Date(a.started_at).getTime() +
            Number(quiz.time_limit_seconds ?? 600) * 1000,
        ),
        serverTime: new Date(),
        answers: draft?.answers ?? [],
      };
    });
  }
  async draft(attemptId: number, actor: Actor, answers: unknown) {
    if (!Array.isArray(answers) || answers.length > 500)
      throw new BadRequestException('Đáp án không hợp lệ');
    return this.db.transaction(async (m) => {
      const [a] = await m.query(
        `SELECT a.*,COALESCE(q.time_limit_seconds,600) AS time_limit_seconds FROM assessment.quiz_attempts a JOIN assessment.quizzes q USING(quiz_id) WHERE attempt_id=$1 AND student_id=$2 FOR UPDATE OF a`,
        [attemptId, actor.userId],
      );
      if (
        !a ||
        a.status !== 'IN_PROGRESS' ||
        Date.now() >
          new Date(a.started_at).getTime() + a.time_limit_seconds * 1000
      )
        throw new BadRequestException('Bài làm đã đóng hoặc hết thời gian');
      await m.query(
        `INSERT INTO assessment.attempt_drafts(attempt_id,answers) VALUES($1,$2::jsonb) ON CONFLICT(attempt_id) DO UPDATE SET answers=EXCLUDED.answers,updated_at=now()`,
        [attemptId, JSON.stringify(answers)],
      );
      return { saved: true };
    });
  }
  async submit(
    attemptId: number,
    actor: Actor,
    incoming: { questionId: number; answerId?: number; answerIds?: number[] }[],
  ) {
    const [context] = await this.db.query(
      'SELECT course_id FROM assessment.quiz_attempts WHERE attempt_id=$1 AND student_id=$2',
      [attemptId, actor.userId],
    );
    if (!context) throw new NotFoundException('Bài làm không thuộc học viên');
    await this.access.study(actor, Number(context.course_id));
    return this.db.transaction(async (m) => {
      const [a] = await m.query(
        `SELECT a.*,COALESCE(q.time_limit_seconds,600) AS time_limit_seconds,q.passing_score,q.lesson_id FROM assessment.quiz_attempts a JOIN assessment.quizzes q USING(quiz_id) WHERE attempt_id=$1 AND student_id=$2 FOR UPDATE OF a`,
        [attemptId, actor.userId],
      );
      if (a.status !== 'IN_PROGRESS') return this.result(a);
      const elapsed = Math.floor(
        (Date.now() - new Date(a.started_at).getTime()) / 1000,
      );
      const expired = elapsed > Number(a.time_limit_seconds) + 3;
      const [draft] = await m.query(
        'SELECT answers FROM assessment.attempt_drafts WHERE attempt_id=$1',
        [attemptId],
      );
      // Late submissions use only answers already saved before the server deadline.
      const selections = expired ? (draft?.answers ?? []) : incoming;
      if (
        !Array.isArray(selections) ||
        selections.length > 500 ||
        new Set(selections.map((x) => Number(x.questionId))).size !==
          selections.length
      )
        throw new BadRequestException('Đáp án trùng hoặc không hợp lệ');
      const questions: any[] = await m.query(
        'SELECT * FROM assessment.questions WHERE quiz_id=$1 ORDER BY question_order',
        [a.quiz_id],
      );
      if (!questions.length)
        throw new BadRequestException('Quiz chưa có câu hỏi');
      if (
        selections.some(
          (x) =>
            !questions.some(
              (q) => Number(q.question_id) === Number(x.questionId),
            ),
        )
      )
        throw new BadRequestException('Câu hỏi không thuộc bài thi');
      let earned = 0,
        total = 0,
        correctCount = 0;
      for (const q of questions) {
        total += Number(q.points);
        const options: any[] = await m.query(
          'SELECT * FROM assessment.answers WHERE question_id=$1',
          [q.question_id],
        );
        const selected = selections.find(
          (x) => Number(x.questionId) === Number(q.question_id),
        );
        const ids: number[] = selected
          ? (
              selected.answerIds ??
              (selected.answerId ? [selected.answerId] : [])
            ).map(Number)
          : [];
        if (
          new Set(ids).size !== ids.length ||
          ids.some((id) => !options.some((o) => Number(o.answer_id) === id)) ||
          (q.question_type !== 'MULTIPLE_CHOICE' && ids.length > 1)
        )
          throw new BadRequestException(
            'Đáp án không thuộc câu hỏi hoặc vượt số lựa chọn',
          );
        const expected = options
          .filter((o) => o.is_correct)
          .map((o) => Number(o.answer_id));
        const correct =
          expected.length > 0 &&
          ids.length === expected.length &&
          expected.every((id) => ids.includes(id));
        if (correct) {
          earned += Number(q.points);
          correctCount++;
        }
        for (const [index, id] of ids.entries())
          await m.query(
            `INSERT INTO assessment.quiz_attempt_answers(attempt_id,quiz_id,question_id,answer_id,is_correct,score_awarded) VALUES($1,$2,$3,$4,$5,$6)`,
            [
              attemptId,
              a.quiz_id,
              q.question_id,
              id,
              correct,
              index === 0 && correct ? Number(q.points) : 0,
            ],
          );
      }
      const score = total ? Math.round((earned / total) * 1000) / 100 : 0;
      await m.query(
        `UPDATE assessment.quiz_attempts SET score=$2,duration_seconds=$3,submitted_at=now(),status='GRADED' WHERE attempt_id=$1`,
        [attemptId, score, Math.min(elapsed, Number(a.time_limit_seconds))],
      );
      const [graded] = await m.query(
        'SELECT * FROM assessment.quiz_attempts WHERE attempt_id=$1',
        [attemptId],
      );
      if (a.lesson_id && score >= Number(a.passing_score))
        await m.query(
          `INSERT INTO learning.lesson_progress(student_id,course_id,lesson_id,status,progress_percent,completed_at) VALUES($1,$2,$3,'COMPLETED',100,now()) ON CONFLICT(student_id,lesson_id) DO UPDATE SET status='COMPLETED',progress_percent=100,completed_at=COALESCE(learning.lesson_progress.completed_at,now())`,
          [actor.userId, a.course_id, a.lesson_id],
        );
      await m.query(
        `SELECT learning.fn_log_learning_event(gen_random_uuid(),$1::bigint,$2::bigint,NULL,$3::bigint,$4::bigint,gen_random_uuid(),'SUBMIT_QUIZ',now(),$5::numeric,$6::integer,'COMPLETED','WEB','REAL',$7::jsonb)`,
        [
          actor.userId,
          a.course_id,
          a.quiz_id,
          attemptId,
          score,
          Math.min(elapsed, Number(a.time_limit_seconds)),
          JSON.stringify({ serverGraded: true }),
        ],
      );
      return {
        ...this.result({ ...graded, passing_score: a.passing_score }),
        correctCount,
        totalQuestions: questions.length,
        expired,
      };
    });
  }
  private result(a: any) {
    return {
      attemptId: Number(a.attempt_id),
      quizId: Number(a.quiz_id),
      courseId: Number(a.course_id),
      score: Number(a.score),
      durationSeconds: a.duration_seconds,
      status: a.status,
      passed: Number(a.score) >= Number(a.passing_score),
      submittedAt: a.submitted_at,
    };
  }
}
