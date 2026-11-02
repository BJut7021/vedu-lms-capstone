import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { PortalService } from './portal.service';

describe('PortalService teacher course status workflow', () => {
  function fixture() {
    const manager = { query: jest.fn<any>() };
    const dataSource = {
      query: jest.fn<any>().mockResolvedValue([]),
      transaction: jest.fn<any>((callback: any) => callback(manager)),
    };
    return {
      manager,
      dataSource,
      service: new PortalService(dataSource as any),
    };
  }

  it('archives an owned course, writes an audit record and notifies admins', async () => {
    const { manager, service } = fixture();
    manager.query
      .mockResolvedValueOnce([
        {
          course_id: 98,
          course_name: 'Cấu trúc dữ liệu và giải thuật',
          teacher_id: 160,
          teacher_name: 'Nguyễn Minh An',
          status: 'PUBLISHED',
          review_status: 'APPROVED',
        },
      ])
      .mockResolvedValueOnce([
        {
          courseId: 98,
          courseName: 'Cấu trúc dữ liệu và giải thuật',
          status: 'ARCHIVED',
          reviewStatus: 'APPROVED',
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await service.updateCourseStatus(160, 98, 'ARCHIVED');

    expect(result).toMatchObject({
      status: 'ARCHIVED',
      reviewStatus: 'APPROVED',
    });
    expect(manager.query.mock.calls[2][0]).toContain(
      'INSERT INTO system_config.audit_logs',
    );
    expect(manager.query.mock.calls[3][0]).toContain(
      'INSERT INTO auth.notifications',
    );
  });

  it('submits a draft as PENDING instead of publishing without admin review', async () => {
    const { manager, service } = fixture();
    manager.query
      .mockResolvedValueOnce([
        {
          course_id: 98,
          course_name: 'Cấu trúc dữ liệu và giải thuật',
          teacher_id: 160,
          teacher_name: 'Nguyễn Minh An',
          status: 'ARCHIVED',
          review_status: 'APPROVED',
        },
      ])
      .mockResolvedValueOnce([
        {
          courseId: 98,
          courseName: 'Cấu trúc dữ liệu và giải thuật',
          status: 'DRAFT',
          reviewStatus: 'PENDING',
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await service.updateCourseStatus(160, 98, 'PUBLISHED');

    expect(result).toMatchObject({ status: 'DRAFT', reviewStatus: 'PENDING' });
    expect(manager.query.mock.calls[1][1]).toEqual([98, 'DRAFT', 'PENDING']);
  });

  it('prevents an assistant teacher from changing the whole course lifecycle', async () => {
    const { manager, service } = fixture();
    manager.query.mockResolvedValueOnce([
      {
        course_id: 98,
        course_name: 'Cấu trúc dữ liệu và giải thuật',
        teacher_id: 160,
        teacher_name: 'Nguyễn Minh An',
        status: 'PUBLISHED',
        review_status: 'APPROVED',
      },
    ]);

    await expect(
      service.updateCourseStatus(161, 98, 'ARCHIVED'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(manager.query).toHaveBeenCalledTimes(1);
  });

  it('counts both UNREVIEWED and PENDING courses on the admin dashboard', async () => {
    const { dataSource, service } = fixture();
    await service.overview(7, 'ADMIN');
    expect(dataSource.query.mock.calls[0][0]).toContain(
      "review_status IN ('UNREVIEWED','PENDING')",
    );
  });
});
