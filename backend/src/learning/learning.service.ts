import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';


const ALLOWED_ACTIONS = new Set([
  'VIEW_LESSON',
  'REVIEW_LESSON',
  'START_QUIZ',
  'SUBMIT_QUIZ',
]);


@Injectable()
export class LearningService {
  constructor(private readonly dataSource: DataSource) {}

  async logEvent(
    studentId: number,
    data: {
      eventUuid: string;
      learningSessionId: string;
      courseId: number;
      lessonId?: number;
      quizId?: number;
      quizAttemptId?: number;
      action: string;
      quizScore?: number;
      durationSeconds?: number;
      completionStatus?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    const action = data.action?.trim().toUpperCase();
    if (!ALLOWED_ACTIONS.has(action)) {
      throw new BadRequestException('Hành vi học tập không hợp lệ');
    }

    if (!data.eventUuid || !data.learningSessionId || !data.courseId) {
      throw new BadRequestException(
        'Thiếu eventUuid, learningSessionId hoặc courseId',
      );
    }

    if (data.lessonId) {
      const [lesson] = await this.dataSource.query(`SELECT l.lesson_id,
        EXISTS(SELECT 1 FROM lms.lesson_resources r WHERE r.lesson_id=l.lesson_id AND r.resource_type='VIDEO') AS video
        FROM lms.lessons l WHERE lesson_id=$1 AND course_id=$2 AND is_published AND NOT is_deleted`,[data.lessonId,data.courseId]);
      if(!lesson) throw new BadRequestException('Bài học không thuộc khóa học');
      if(lesson.video && (action==='COMPLETE_LESSON' || Number(data.durationSeconds)>0)) throw new BadRequestException('Tiến độ video chỉ ghi nhận qua heartbeat máy chủ');
    }
    if (['START_QUIZ','SUBMIT_QUIZ'].includes(action)) throw new BadRequestException('Sự kiện quiz do máy chủ chấm bài ghi nhận, không nhận điểm từ client');

    if(!/^[a-f0-9-]{36}$/i.test(data.eventUuid) || !/^[a-f0-9-]{36}$/i.test(data.learningSessionId)) throw new BadRequestException('UUID không hợp lệ');
    const durationSeconds = 0;
    if (
      durationSeconds !== null &&
      (!Number.isInteger(durationSeconds) ||
        durationSeconds < 0 ||
        durationSeconds > 60)
    ) {
      throw new BadRequestException(
        'Thời lượng mỗi sự kiện phải là số nguyên từ 0 đến 60 giây',
      );
    }

    const rows = await this.dataSource.query(
      `SELECT learning.fn_log_learning_event(
        $1::uuid, $2::bigint, $3::bigint, $4::bigint, $5::bigint,
        $6::bigint, $7::uuid, $8::varchar, CURRENT_TIMESTAMP,
        $9::numeric, $10::integer, $11::varchar, 'WEB', 'REAL', $12::jsonb
      ) AS "logId"`,
      [
        data.eventUuid,
        studentId,
        data.courseId,
        data.lessonId ?? null,
        data.quizId ?? null,
        data.quizAttemptId ?? null,
        data.learningSessionId,
        action,
        null,
        durationSeconds,
        data.completionStatus ?? null,
        JSON.stringify({client:'vedu-web',manualDocumentComplete:action==='COMPLETE_LESSON'}),
      ],
    );

    return {
      message: 'Đã ghi nhận hành vi học tập',
      logId: Number(rows[0].logId),
    };
  }
}
