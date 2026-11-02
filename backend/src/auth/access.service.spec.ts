import { jest } from '@jest/globals';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AccessService, Actor } from './access.service';

describe('AccessService course ownership policy', () => {
  const admin: Actor = { userId: 1, role: 'ADMIN' };
  const owner: Actor = { userId: 20, role: 'TEACHER' };
  const assistant: Actor = { userId: 21, role: 'TEACHER' };

  function fixture(results: any[][]) {
    const query = jest.fn<any>();
    for (const result of results) query.mockResolvedValueOnce(result);
    return { query, service: new AccessService({ query } as any) };
  }

  it('rejects a missing or soft-deleted course', async () => {
    const { service } = fixture([[]]);
    await expect(service.manageCourse(admin, 99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('allows an administrator without requiring an assignment', async () => {
    const { query, service } = fixture([[{ course_id: 7, teacher_id: 20 }]]);
    await expect(service.manageCourse(admin, 7)).resolves.toBeDefined();
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('allows the principal teacher who owns the course', async () => {
    const { service } = fixture([
      [{ course_id: 7, teacher_id: owner.userId }],
      [],
    ]);
    await expect(service.manageCourse(owner, 7)).resolves.toBeDefined();
  });

  it('allows an assigned assistant teacher', async () => {
    const { service } = fixture([
      [{ course_id: 7, teacher_id: owner.userId }],
      [{ '?column?': 1 }],
    ]);
    await expect(service.manageCourse(assistant, 7)).resolves.toBeDefined();
  });

  it('rejects an unassigned teacher', async () => {
    const { service } = fixture([
      [{ course_id: 7, teacher_id: owner.userId }],
      [],
    ]);
    await expect(service.manageCourse(assistant, 7)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects a student even if an invalid assignment row exists', async () => {
    const { service } = fixture([
      [{ course_id: 7, teacher_id: owner.userId }],
      [{ '?column?': 1 }],
    ]);
    await expect(
      service.manageCourse({ userId: 30, role: 'STUDENT' }, 7),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
