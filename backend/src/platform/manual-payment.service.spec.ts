import { jest } from '@jest/globals';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import type { Actor } from '../auth/access.service';
import { ManualPaymentService } from './manual-payment.service';

describe('ManualPaymentService MoMo personal reconciliation', () => {
  const student: Actor = { userId: 21, role: 'STUDENT' };
  const admin: Actor = { userId: 7, role: 'ADMIN' };
  const requestId = '5b4cf243-6326-4271-9388-36c5fd66a398';

  function fixture() {
    const manager = { query: jest.fn<any>() };
    const db = {
      query: jest.fn<any>(),
      transaction: jest.fn<any>((callback: any) => callback(manager)),
    };
    const momo = { status: jest.fn<any>() };
    return {
      db,
      manager,
      service: new ManualPaymentService(db as any, momo as any),
    };
  }

  it('blocks guest learners and non-admin users from payment operations', async () => {
    const { service } = fixture();

    await expect(
      service.report(
        { userId: 99, role: 'STUDENT', isGuest: true },
        requestId,
        '154131562196',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.list(student)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('requires a safe MoMo transaction code before requesting review', async () => {
    const { service, db } = fixture();

    await expect(
      service.report(student, requestId, 'đã chuyển lúc 10 giờ'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it('normalizes the transaction code and moves an owned request to REVIEW', async () => {
    const { service, manager } = fixture();
    manager.query
      .mockResolvedValueOnce([
        {
          request_id: requestId,
          student_id: student.userId,
          order_status: 'PENDING',
          status: 'PENDING',
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await service.report(student, requestId, '# 154131562196');

    expect(manager.query.mock.calls[1][1]).toEqual([
      requestId,
      '154131562196',
    ]);
    expect(String(manager.query.mock.calls[1][0])).toContain("status='REVIEW'");
  });

  it('does not approve an order before the learner submits it for review', async () => {
    const { service, manager } = fixture();
    manager.query.mockResolvedValueOnce([
      {
        request_id: requestId,
        order_id: 41,
        student_id: student.userId,
        course_id: 98,
        final_amount: 449000,
        order_status: 'PENDING',
        status: 'PENDING',
        method: 'MOMO_WALLET',
        reference: 'VEDU836A91BD0C9E',
      },
    ]);

    await expect(
      service.review(admin, requestId, {
        decision: 'APPROVE',
        verified: true,
        receivedAmount: 449000,
        receivedReference: 'VEDU836A91BD0C9E',
        transactionCode: '154131562196',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('records one PAID payment and approval after exact reconciliation', async () => {
    const { service, manager } = fixture();
    manager.query.mockImplementation(async (sql: string) => {
      if (sql.startsWith('SELECT r.*'))
        return [
          {
            request_id: requestId,
            order_id: 41,
            student_id: student.userId,
            course_id: 98,
            final_amount: 449000,
            order_status: 'PENDING',
            status: 'REVIEW',
            method: 'MOMO_WALLET',
            reference: 'VEDU836A91BD0C9E',
          },
        ];
      if (sql.includes('INSERT INTO payment.payments'))
        return [{ payment_id: 77 }];
      return [];
    });

    const result = await service.review(admin, requestId, {
      decision: 'APPROVE',
      verified: true,
      receivedAmount: 449000,
      receivedReference: 'VEDU836A91BD0C9E',
      transactionCode: '#154131562196',
    });

    expect(result.message).toContain('mở quyền học');
    const paymentCall = manager.query.mock.calls.find(([sql]) =>
      String(sql).includes('INSERT INTO payment.payments'),
    );
    expect(paymentCall?.[1]).toEqual([
      41,
      449000,
      'MOMO',
      'MOMO_PERSONAL',
      '154131562196',
      expect.any(String),
    ]);
    expect(
      manager.query.mock.calls.some(([sql]) =>
        String(sql).includes("status='APPROVED'"),
      ),
    ).toBe(true);
  });

  it('turns a duplicate transaction code into a clear conflict', async () => {
    const { service, db } = fixture();
    db.transaction.mockRejectedValueOnce({ code: '23505' });

    await expect(
      service.review(admin, requestId, {
        decision: 'APPROVE',
        note: 'Đã nhận đủ học phí.',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
