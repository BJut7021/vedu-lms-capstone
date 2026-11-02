import { jest } from '@jest/globals';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { PlatformService } from './platform.service';
import type { Actor } from '../auth/access.service';

describe('PlatformService scoped teacher quiz API', () => {
  const teacher: Actor = { userId: 20, role: 'TEACHER' };
  const quiz = {
    quiz_id: 5,
    course_id: 7,
    title: 'Kiểm tra cuối khóa',
    time_limit_seconds: 900,
    passing_score: '5.00',
    max_attempts: 3,
    attempt_count: 0,
  };
  const payload = {
    title: 'Kiểm tra cuối khóa đã cập nhật',
    timeLimitSeconds: 1200,
    passingScore: 6,
    maxAttempts: 2,
    questions: [
      {
        text: 'Đáp án đúng là gì?',
        type: 'SINGLE_CHOICE',
        options: [
          { text: 'A', correct: true },
          { text: 'B', correct: false },
        ],
      },
    ],
  };

  function fixture() {
    const db = {
      query: jest.fn<any>(),
      transaction: jest.fn<any>(),
    };
    const access = { manageCourse: jest.fn<any>().mockResolvedValue({}) };
    const service = new PlatformService(
      db as any,
      access as any,
      {} as any,
      {} as any,
      {} as any,
    );
    return { db, access, service };
  }

  it('authorizes the quiz course before exposing correct answers', async () => {
    const { db, access, service } = fixture();
    db.query.mockResolvedValueOnce([quiz]).mockResolvedValueOnce([
      {
        question_id: 10,
        question_text: '2 + 2 = ?',
        question_type: 'SINGLE_CHOICE',
        answer_id: 100,
        answer_text: '4',
        is_correct: true,
      },
    ]);

    const result = await service.teacherQuiz(teacher, 5);

    expect(access.manageCourse).toHaveBeenCalledWith(teacher, 7);
    expect(result.questions[0].options[0]).toEqual({
      id: 100,
      text: '4',
      correct: true,
    });
  });

  it('does not query answers when course authorization fails', async () => {
    const { db, access, service } = fixture();
    db.query.mockResolvedValueOnce([quiz]);
    access.manageCourse.mockRejectedValueOnce(new ForbiddenException());

    await expect(service.teacherQuiz(teacher, 5)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  it('blocks replacing questions after the first attempt', async () => {
    const { db, service } = fixture();
    db.query.mockResolvedValueOnce([quiz]);
    const manager = { query: jest.fn<any>() };
    manager.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ ...quiz, attempt_count: 1 }]);
    db.transaction.mockImplementationOnce((callback: any) => callback(manager));

    await expect(
      service.updateTeacherQuiz(teacher, 5, payload),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(
      manager.query.mock.calls.some(([sql]) =>
        String(sql).startsWith('UPDATE assessment.quizzes'),
      ),
    ).toBe(false);
  });

  it('updates metadata and replaces questions atomically before any attempt', async () => {
    const { db, service } = fixture();
    db.query.mockResolvedValueOnce([quiz]);
    const manager = { query: jest.fn<any>() };
    manager.query.mockImplementation(async (sql: string) => {
      if (sql.includes('pg_advisory_xact_lock')) return [];
      if (sql.includes('FROM assessment.quizzes q')) return [quiz];
      if (sql.includes('UPDATE assessment.quizzes'))
        return [
          {
            ...quiz,
            title: payload.title,
            time_limit_seconds: payload.timeLimitSeconds,
            passing_score: payload.passingScore,
            max_attempts: payload.maxAttempts,
          },
        ];
      if (sql.includes('RETURNING question_id')) return [{ question_id: 11 }];
      if (sql.includes('FROM assessment.questions q'))
        return [
          {
            question_id: 11,
            question_text: payload.questions[0].text,
            question_type: 'SINGLE_CHOICE',
            answer_id: 101,
            answer_text: 'A',
            is_correct: true,
          },
        ];
      return [];
    });
    db.transaction.mockImplementationOnce((callback: any) => callback(manager));

    const result = await service.updateTeacherQuiz(teacher, 5, payload);

    expect(result.title).toBe(payload.title);
    expect(result.questions).toHaveLength(1);
    expect(
      manager.query.mock.calls.some(([sql]) =>
        String(sql).startsWith('DELETE FROM assessment.questions'),
      ),
    ).toBe(true);
  });

  it('soft-deletes a quiz and never deletes attempt history', async () => {
    const { db, service } = fixture();
    db.query.mockResolvedValueOnce([{ ...quiz, attempt_count: 4 }]);
    const manager = { query: jest.fn<any>() };
    manager.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ quiz_id: 5 }]);
    db.transaction.mockImplementationOnce((callback: any) => callback(manager));

    const result = await service.archiveTeacherQuiz(teacher, 5);

    expect(result).toMatchObject({ quizId: 5, archived: true });
    const sql = manager.query.mock.calls.map(([statement]) =>
      String(statement),
    );
    expect(sql.some((statement) => statement.includes('is_deleted=true'))).toBe(
      true,
    );
    expect(
      sql.some((statement) => /DELETE.*quiz_attempts/i.test(statement)),
    ).toBe(false);
  });
});
