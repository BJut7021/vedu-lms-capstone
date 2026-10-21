import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { DataSource } from 'typeorm';
import { Actor } from '../auth/access.service';

export const momoSignature = (
  fields: Record<string, string | number | null | undefined>,
  secret: string,
) =>
  createHmac('sha256', secret)
    .update(
      Object.keys(fields)
        .sort()
        .map((k) => `${k}=${fields[k] ?? ''}`)
        .join('&'),
    )
    .digest('hex');
@Injectable()
export class MomoService {
  constructor(private readonly db: DataSource) {}
  private config() {
    const partnerCode = process.env.MOMO_PARTNER_CODE,
      accessKey = process.env.MOMO_ACCESS_KEY,
      secretKey = process.env.MOMO_SECRET_KEY;
    if (!partnerCode || !accessKey || !secretKey || !process.env.MOMO_IPN_URL)
      throw new ServiceUnavailableException(
        'Chưa cấu hình MoMo Sandbox. Bổ sung MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY và URL IPN công khai trong .env. Khóa học vẫn khóa trước khi thanh toán.',
      );
    return { partnerCode, accessKey, secretKey };
  }
  async status(actor: Actor, courseId: number) {
    const [c] = await this.db.query(
      "SELECT * FROM lms.courses WHERE course_id=$1 AND status='PUBLISHED' AND NOT is_deleted",
      [courseId],
    );
    if (!c) throw new BadRequestException('Khóa học không tồn tại');
    const [e] = await this.db.query(
      `SELECT e.enrollment_id,e.final_price,o.order_id,o.status FROM enrollment.enrollments e LEFT JOIN payment.orders o USING(enrollment_id) WHERE e.student_id=$1 AND e.course_id=$2 AND e.status IN ('ACTIVE','COMPLETED')`,
      [actor.userId, courseId],
    );
    return {
      courseId,
      title: c.course_name,
      amount: Number(e?.final_price ?? c.price),
      currency: c.currency,
      paid: !!e && (Number(e.final_price) === 0 || e.status === 'PAID'),
      orderId: e?.order_id ?? null,
      status: e?.status ?? 'NOT_ENROLLED',
      sandbox: process.env.MOMO_ENV !== 'production',
      configured: !!(
        process.env.MOMO_PARTNER_CODE &&
        process.env.MOMO_ACCESS_KEY &&
        process.env.MOMO_SECRET_KEY &&
        process.env.MOMO_IPN_URL
      ),
    };
  }
  async checkout(actor: Actor, courseId: number) {
    if (actor.role !== 'STUDENT')
      throw new BadRequestException('Chỉ học viên thanh toán');
    const cfg = this.config();
    const status = await this.status(actor, courseId);
    if (status.paid) return { ...status, payUrl: null };
    if (
      status.currency !== 'VND' ||
      status.amount < 1000 ||
      status.amount > 50000000
    )
      throw new BadRequestException('MoMo nhận VND, số tiền 1.000–50.000.000');
    const requestId = randomUUID(),
      orderId = `VEDU-${randomUUID()}`;
    const saved = await this.db.transaction(async (m) => {
      await m.query('SELECT pg_advisory_xact_lock($1::integer,$2::integer)', [
        actor.userId,
        courseId,
      ]);
      const [e] = await m.query(
        'SELECT enrollment.fn_enroll_student($1::bigint,$2::bigint) AS id',
        [actor.userId, courseId],
      );
      const [o] = await m.query(
        'SELECT payment.fn_create_order($1::bigint) AS id',
        [e.id],
      );
      const [order] = await m.query(
        'SELECT * FROM payment.orders WHERE order_id=$1 FOR UPDATE',
        [o.id],
      );
      if (order.status === 'PAID')
        throw new BadRequestException('Đơn hàng đã thanh toán');
      const [pending] = await m.query(
        "SELECT request_id,provider_order_id,pay_url FROM payment.momo_requests WHERE order_id=$1 AND status='PENDING' ORDER BY created_at DESC LIMIT 1",
        [o.id],
      );
      if (pending?.pay_url)
        return { amount: Number(order.final_amount), existing: pending };
      if (pending)
        throw new BadRequestException(
          'Đang tạo phiên thanh toán. Vui lòng thử lại sau ít giây.',
        );
      const [p] = await m.query(
        `INSERT INTO payment.payments(order_id,amount,currency,payment_method,provider,status,idempotency_key) VALUES($1,$2,$3,'MOMO',$4,'PENDING',$5::uuid) RETURNING payment_id`,
        [
          o.id,
          order.final_amount,
          order.currency,
          process.env.MOMO_ENV === 'production'
            ? 'MOMO_PRODUCTION'
            : 'MOMO_SANDBOX',
          requestId,
        ],
      );
      await m.query(
        'INSERT INTO payment.momo_requests(request_id,provider_order_id,order_id,payment_id) VALUES($1,$2,$3,$4)',
        [requestId, orderId, o.id, p.payment_id],
      );
      return { amount: Number(order.final_amount) };
    });
    if ('existing' in saved && saved.existing)
      return {
        requestId: saved.existing.request_id,
        orderId: saved.existing.provider_order_id,
        payUrl: saved.existing.pay_url,
        sandbox: process.env.MOMO_ENV !== 'production',
      };
    const fields = {
      partnerCode: cfg.partnerCode,
      requestId,
      amount: saved.amount,
      orderId,
      orderInfo: `Thanh toán khóa học VEDU ${courseId}`,
      redirectUrl:
        process.env.MOMO_REDIRECT_URL ||
        `${process.env.WEB_URL || 'http://localhost:8080'}/checkout/${courseId}`,
      ipnUrl: process.env.MOMO_IPN_URL,
      requestType: 'captureWallet',
      extraData: '',
    };
    const signature = momoSignature(
      { accessKey: cfg.accessKey, ...fields },
      cfg.secretKey,
    );
    const gateway =
      process.env.MOMO_ENV === 'production'
        ? 'https://payment.momo.vn/v2/gateway/api/create'
        : 'https://test-payment.momo.vn/v2/gateway/api/create';
    let result: any;
    try {
      const response = await fetch(gateway, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, lang: 'vi', signature }),
        signal: AbortSignal.timeout(35000),
      });
      result = await response.json();
      if (!response.ok || result.resultCode !== 0 || !result.payUrl)
        throw new Error(String(result.message ?? 'Không tạo được thanh toán'));
      const url = new URL(result.payUrl);
      if (url.protocol !== 'https:' || !/(^|\.)momo\.vn$/.test(url.hostname))
        throw new Error('URL thanh toán không hợp lệ');
    } catch (error) {
      await this.db.query(
        "UPDATE payment.momo_requests SET status='FAILED' WHERE request_id=$1",
        [requestId],
      );
      throw new ServiceUnavailableException(
        `MoMo không tạo được phiên thanh toán: ${error instanceof Error ? error.message : 'Lỗi gateway'}`,
      );
    }
    await this.db.query(
      'UPDATE payment.momo_requests SET pay_url=$2 WHERE request_id=$1',
      [requestId, result.payUrl],
    );
    return {
      requestId,
      orderId,
      payUrl: result.payUrl,
      sandbox: process.env.MOMO_ENV !== 'production',
    };
  }
  async ipn(body: any) {
    const cfg = this.config();
    const keys = [
      'amount',
      'extraData',
      'message',
      'orderId',
      'orderInfo',
      'orderType',
      'partnerCode',
      'payType',
      'requestId',
      'responseTime',
      'resultCode',
      'transId',
    ];
    const fields: Record<string, string | number | null | undefined> = { accessKey: cfg.accessKey };
    for (const k of keys) {
      if (
        body[k] === undefined ||
        (typeof body[k] !== 'string' && typeof body[k] !== 'number')
      )
        throw new BadRequestException('IPN thiếu trường');
      fields[k] = body[k];
    }
    const expected = Buffer.from(momoSignature(fields, cfg.secretKey), 'hex');
    const received =
      typeof body.signature === 'string' &&
      /^[a-f0-9]{64}$/i.test(body.signature)
        ? Buffer.from(body.signature, 'hex')
        : Buffer.alloc(0);
    if (
      received.length !== expected.length ||
      !timingSafeEqual(received, expected) ||
      body.partnerCode !== cfg.partnerCode
    )
      throw new UnauthorizedException('Chữ ký MoMo không đúng');
    await this.db.transaction(async (m) => {
      const [r] = await m.query(
        `SELECT r.*,p.amount,p.currency,o.status AS order_status FROM payment.momo_requests r JOIN payment.payments p USING(payment_id) JOIN payment.orders o ON o.order_id=r.order_id WHERE r.request_id=$1 AND r.provider_order_id=$2 FOR UPDATE OF r,p,o`,
        [body.requestId, body.orderId],
      );
      if (
        !r ||
        Number(r.amount) !== Number(body.amount) ||
        r.currency !== 'VND'
      )
        throw new BadRequestException('Đơn hàng hoặc số tiền không khớp');
      if (r.status === 'PAID') return; // Idempotent provider retries.
      if (
        Number(body.resultCode) === 0 &&
        !['REFUNDED', 'CANCELLED'].includes(r.order_status)
      ) {
        await m.query(
          "UPDATE payment.payments SET status='PAID',transaction_code=$2,paid_at=now(),provider_payload=$3 WHERE payment_id=$1",
          [r.payment_id, String(body.transId), JSON.stringify(body)],
        );
        await m.query(
          "UPDATE payment.momo_requests SET status='PAID' WHERE request_id=$1",
          [body.requestId],
        );
      } else if (Number(body.resultCode) !== 9000) {
        await m.query(
          "UPDATE payment.payments SET status='FAILED',failed_at=now(),provider_payload=$2 WHERE payment_id=$1 AND status<>'PAID'",
          [r.payment_id, JSON.stringify(body)],
        );
        await m.query(
          "UPDATE payment.momo_requests SET status='FAILED' WHERE request_id=$1 AND status<>'PAID'",
          [body.requestId],
        );
      }
    });
  }
}
