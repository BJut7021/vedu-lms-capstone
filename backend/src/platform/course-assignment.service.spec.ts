import { jest } from '@jest/globals';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import type { Actor } from '../auth/access.service';
import { CourseAssignmentService } from './course-assignment.service';

describe('CourseAssignmentService workflow and ownership', () => {
  const student: Actor = { userId: 21, role: 'STUDENT' };
  const otherStudent: Actor = { userId: 22, role: 'STUDENT' };
  const teacher: Actor = { userId: 7, role: 'TEACHER' };

  function fixture() {
    const manager = { query: jest.fn<any>() };
    const db = {
      query: jest.fn<any>(),
      transaction: jest.fn<any>((callback: any) => callback(manager)),
    };
    const access = {
      study: jest.fn<any>(),
      manageCourse: jest.fn<any>(),
    };
    return {
      db,
      manager,
      access,
      service: new CourseAssignmentService(db as any, access as any),
    };
  }

  it('blocks guest learners before reading or writing an assignment', async () => {
    const { service, db } = fixture();
    await expect(
      service.save({ ...student, isGuest: true }, 3, { answer: 'test' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('does not expose another learner submission file', async () => {
    const { service, db, access } = fixture();
    db.query.mockResolvedValueOnce([{
      version_id: 90,
      student_id: student.userId,
      status: 'SUBMITTED',
      file_name: 'evidence.pdf',
      course_id: 75,
      rubric: [],
      passing_score: 7,
    }]);

    await expect(service.download(otherStudent, 90)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(access.study).not.toHaveBeenCalled();
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  it('creates a new immutable version after NEEDS_REVISION', async () => {
    const { service, db, manager, access } = fixture();
    db.query.mockResolvedValueOnce([{
      assignment_id: 3,
      course_id: 75,
      section_id: 104,
      assignment_key: 'inheritance-lab',
      title: 'Thực hành kế thừa',
      allowed_file_types: ['pdf', 'zip'],
    }]);
    manager.query.mockImplementation(async (sql: string) => {
      if (sql.includes('ORDER BY version_no DESC'))
        return [{ version_id: 10, status: 'NEEDS_REVISION', outcome: 'REVISE', version_no: 1 }];
      if (sql.includes('INSERT INTO assessment.course_assignment_versions'))
        return [{ version_id: 11, status: 'SUBMITTED' }];
      return [];
    });

    const saved = await service.save(student, 3, {
      answer: 'Phiên bản đã sửa theo phản hồi',
      submit: true,
    });

    expect(saved).toEqual({ version_id: 11, status: 'SUBMITTED' });
    expect(access.study).toHaveBeenCalledWith(student, 75);
    const insert = manager.query.mock.calls.find(([sql]) =>
      String(sql).includes('INSERT INTO assessment.course_assignment_versions'),
    );
    expect(insert?.[1]?.[3]).toBe(2);
    expect(
      manager.query.mock.calls.some(([sql]) =>
        String(sql).includes('INSERT INTO auth.notifications'),
      ),
    ).toBe(true);
  });

  it('protects rubric and completion semantics after the first submission', async () => {
    const { service, db, access } = fixture();
    const rubric = [
      { id: 'knowledge', label: 'Kiến thức', skill: 'knowledge', max: 10, min: 7 },
    ];
    db.query
      .mockResolvedValueOnce([{
        assignment_id: 3,
        course_id: 75,
        section_id: 104,
        title: 'Bài cũ',
        instructions: 'Yêu cầu cũ',
        rubric,
        passing_score: 7,
        required: true,
        allowed_file_types: ['pdf'],
      }])
      .mockResolvedValueOnce([{ exists: true }])
      .mockResolvedValueOnce([{ exists: true }]);
    access.manageCourse.mockResolvedValue({ course_id: 75 });

    await expect(
      service.update(teacher, 3, {
        sectionId: 104,
        title: 'Bài cũ',
        instructions: 'Yêu cầu cũ',
        rubric,
        passingScore: 6,
        required: true,
        published: true,
        allowedFileTypes: ['pdf'],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(db.query).toHaveBeenCalledTimes(3);
  });
});
