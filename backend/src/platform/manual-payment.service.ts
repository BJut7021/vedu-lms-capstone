import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomBytes } from 'crypto';
import QRCode from 'qrcode';
import sharp from 'sharp';
import type { Actor } from '../auth/access.service';
import { MomoService } from './momo.service';
import { bankQrPayload } from './bank-qr';
import { clearMomoQr, clearStoredMomoQr } from './momo-qr';
@Injectable()
export class ManualPaymentService {
  constructor(
    private readonly db: DataSource,
    private readonly momo: MomoService,
  ) {}
  private mode() {
    return process.env.MOMO_PAYMENT_MODE === 'gateway' ? 'gateway' : 'personal';
  }
  private async wallet() {
    const [row] = await this.db.query(
      'SELECT receiver_name AS "receiverName",receiver_phone AS "receiverPhone",qr_data_url AS "qrDataUrl",updated_at AS "updatedAt" FROM payment.momo_wallet_settings WHERE singleton=true',
    );
    if (row) row.qrDataUrl = await clearStoredMomoQr(row.qrDataUrl);
    return row ?? null;
  }
  async walletSettings(actor: Actor) {
    this.admin(actor);
    return {
      mode: this.mode(),
      wallet: await this.wallet(),
    };
  }
  async configureWallet(actor: Actor, data: any, file?: { buffer: Buffer }) {
    this.admin(actor);
    const name =
      typeof data.receiverName === 'string' ? data.receiverName.trim() : '';
    const phone =
      typeof data.receiverPhone === 'string' ? data.receiverPhone.trim() : '';
    if (
      name.length < 2 ||
      name.length > 120 ||
      !/^(0\d{9}|\+84\d{9})$/.test(phone) ||
      data.confirmReceivingQr !== 'true'
    )
      throw new BadRequestException(
        'Nhập tên chủ ví, số điện thoại MoMo và xác nhận đây là QR Nhận tiền.',
      );
    const old = await this.wallet();
    let qr = old?.qrDataUrl;
    if (file) {
      try {
        const image = sharp(file.buffer, {
          limitInputPixels: 16000000,
          animated: false,
        });
        const meta = await image.metadata();
        if (
          !['png', 'jpeg', 'webp'].includes(meta.format || '') ||
          !meta.width ||
          !meta.height ||
          meta.width < 120 ||
          meta.height < 120 ||
          (meta.pages ?? 1) > 1
        )
          throw Error('Invalid QR image');
        const buffer = await image
          .rotate()
          .resize({
            width: 1200,
            height: 1200,
            fit: 'inside',
            withoutEnlargement: true,
            kernel: 'nearest',
          })
          .flatten({ background: '#ffffff' })
          .png()
          .toBuffer();
        if (buffer.length > 2 * 1024 * 1024) throw Error('Image too large');
        qr = await clearMomoQr(buffer);
      } catch {
        throw new BadRequestException(
          'Không đọc được mã QR. Hãy tải ảnh QR Nhận tiền rõ nét từ MoMo (PNG/JPG/WebP, tối đa 4 MB).',
        );
      }
    } else if (
      old &&
      (old.receiverName !== name || old.receiverPhone !== phone)
    ) {
      throw new BadRequestException(
        'Khi đổi người nhận, cần tải QR mới tương ứng.',
      );
    }
    if (!qr)
      throw new BadRequestException(
        'Tải ảnh QR Nhận tiền đã lưu từ ứng dụng MoMo.',
      );
    await this.db.transaction(async (m) => {
      await m.query(
        'INSERT INTO payment.momo_wallet_settings(singleton,receiver_name,receiver_phone,qr_data_url,updated_by) VALUES(true,$1,$2,$3,$4) ON CONFLICT(singleton) DO UPDATE SET receiver_name=EXCLUDED.receiver_name,receiver_phone=EXCLUDED.receiver_phone,qr_data_url=EXCLUDED.qr_data_url,updated_by=EXCLUDED.updated_by,updated_at=now()',
        [name, phone, qr, actor.userId],
      );
    });
    return {
      message:
        'Đã lưu QR nhận học phí qua MoMo. Đơn đã tạo giữ nguyên thông tin người nhận cũ.',
      ...(await this.walletSettings(actor)),
    };
  }
  private student(actor: Actor) {
    if (actor.role !== 'STUDENT' || actor.isGuest)
      throw new ForbiddenException(
        'Chỉ học viên đã đăng ký được tạo thanh toán.',
      );
  }
  private admin(actor: Actor) {
    if (actor.role !== 'ADMIN')
      throw new ForbiddenException(
        'Chỉ quản trị viên được đối soát thanh toán.',
      );
  }
  private id(id: string) {
    if (!/^[a-f0-9-]{36}$/i.test(id))
      throw new BadRequestException('Mã yêu cầu không hợp lệ.');
  }
  async status(actor: Actor, courseId: number) {
    if (actor.role !== 'STUDENT') throw new ForbiddenException();
    const status = await this.momo.status(actor, courseId);
    if (actor.isGuest)
      return {
        ...status,
        paymentMode: this.mode(),
        walletConfigured: false,
        configured: false,
        manualRequest: null,
      };
    const [row] = await this.db.query(
      `SELECT r.*,o.final_amount FROM payment.manual_requests r JOIN payment.orders o USING(order_id) WHERE o.course_id=$1 AND o.student_id=$2 ORDER BY r.created_at DESC LIMIT 1`,
      [courseId, actor.userId],
    );
    const wallet = await this.wallet();
    return {
      ...status,
      paymentMode: this.mode(),
      configured: this.mode() === 'personal' ? !!wallet : status.configured,
      sandbox: this.mode() === 'gateway' && status.sandbox,
      walletConfigured: !!wallet,
      manualRequest: row ? await this.view(row) : null,
    };
  }
  private async view(r: any) {
    const bank = r.bank_snapshot;
    const qr =
      r.method === 'MOMO_WALLET'
        ? bank?.qrDataUrl
          ? await clearStoredMomoQr(bank.qrDataUrl)
          : null
        : r.method === 'BANK_TRANSFER' &&
            bank &&
            ['PENDING', 'REVIEW', 'REJECTED'].includes(r.status)
          ? await QRCode.toDataURL(
              bankQrPayload(
                bank.bankBin,
                bank.account,
                Number(r.final_amount),
                r.reference,
              ),
              { width: 384, margin: 3, errorCorrectionLevel: 'M' },
            )
          : null;
    return {
      id: r.request_id,
      orderId: Number(r.order_id),
      method: r.method,
      reference: r.reference,
      status: r.status,
      bank: r.method === 'MOMO_WALLET' ? null : bank,
      wallet:
        r.method === 'MOMO_WALLET'
          ? {
              receiverName: bank?.receiverName,
              receiverPhone: bank?.receiverPhone,
            }
          : null,
      qrDataUrl: qr,
      learnerNote: r.learner_note,
      reviewerNote: r.reviewer_note,
      createdAt: r.created_at,
      reportedAt: r.reported_at,
      reviewedAt: r.reviewed_at,
    };
  }
  async create(actor: Actor, courseId: number, method: unknown) {
    this.student(actor);
    if (typeof method !== 'string' || method !== 'MOMO_WALLET')
      throw new BadRequestException('Ứng dụng chỉ nhận học phí qua MoMo.');
    if (this.mode() !== 'personal')
      throw new ConflictException(
        'Hãy thanh toán qua cổng MoMo đang được cấu hình.',
      );
    const snapshot = await this.wallet();
    if (!snapshot)
      throw new ServiceUnavailableException(
        'QR MoMo chưa được cấu hình. Vui lòng liên hệ hỗ trợ.',
      );
    await this.db.transaction(async (m) => {
      await m.query('SELECT pg_advisory_xact_lock($1::int,$2::int)', [
        actor.userId,
        courseId,
      ]);
      const [c] = await m.query(
        "SELECT * FROM lms.courses WHERE course_id=$1 AND status='PUBLISHED' AND NOT is_deleted",
        [courseId],
      );
      if (!c) throw new NotFoundException('Khóa học không tồn tại.');
      const [e] = await m.query(
        'SELECT enrollment.fn_enroll_student($1::bigint,$2::bigint) id',
        [actor.userId, courseId],
      );
      const [enrollment] = await m.query(
        'SELECT * FROM enrollment.enrollments WHERE enrollment_id=$1',
        [e.id],
      );
      if (Number(enrollment.final_price) === 0) return;
      if (
        c.currency !== 'VND' ||
        !Number.isSafeInteger(Number(enrollment.final_price)) ||
        Number(enrollment.final_price) > 50000000
      )
        throw new BadRequestException(
          'Phương thức này nhận VND nguyên, tối đa 50.000.000 đồng.',
        );
      const [o] = await m.query(
        'SELECT * FROM payment.orders WHERE enrollment_id=$1 FOR UPDATE',
        [e.id],
      );
      if (o?.status === 'PAID') return;
      if (o && ['CANCELLED', 'REFUNDED'].includes(o.status))
        throw new ConflictException('Đơn đã đóng; hãy liên hệ hỗ trợ.');
      const [created] = o
        ? [{ id: o.order_id }]
        : await m.query('SELECT payment.fn_create_order($1::bigint) id', [
            e.id,
          ]);
      const [existing] = await m.query(
        'SELECT * FROM payment.manual_requests WHERE order_id=$1 FOR UPDATE',
        [created.id],
      );
      const [momoPending] = await m.query(
        "SELECT 1 FROM payment.momo_requests WHERE order_id=$1 AND status='PENDING' LIMIT 1",
        [created.id],
      );
      if (momoPending)
        throw new ConflictException(
          'Đơn đang có phiên MoMo. Hoàn tất hoặc liên hệ hỗ trợ trước khi đổi phương thức.',
        );
      if (existing) {
        if (existing.method !== method)
          throw new ConflictException(
            'Đơn đã chọn phương thức thanh toán. Liên hệ hỗ trợ nếu cần đổi.',
          );
        return;
      }
      const [r] = await m.query(
        'INSERT INTO payment.manual_requests(order_id,method,reference,bank_snapshot) VALUES($1,$2,$3,$4) RETURNING request_id',
        [
          created.id,
          method,
          'VEDU' + randomBytes(6).toString('hex').toUpperCase(),
          snapshot ? JSON.stringify(snapshot) : null,
        ],
      );
      await m.query(
        "INSERT INTO payment.manual_events(request_id,actor_id,action) VALUES($1,$2,'CREATED')",
        [r.request_id, actor.userId],
      );
    });
    return this.status(actor, courseId);
  }
  async report(actor: Actor, id: string, note: unknown) {
    this.student(actor);
    this.id(id);
    const transactionCode =
      typeof note === 'string' ? note.trim().replace(/^#\s*/, '') : '';
    if (!/^[A-Za-z0-9_.:/-]{4,120}$/.test(transactionCode))
      throw new BadRequestException(
        'Nhập đúng mã giao dịch MoMo (4–120 ký tự, không nhập mật khẩu hoặc OTP).',
      );
    await this.db.transaction(async (m) => {
      const [r] = await m.query(
        'SELECT r.*,o.student_id,o.status order_status FROM payment.manual_requests r JOIN payment.orders o USING(order_id) WHERE request_id=$1 FOR UPDATE OF r,o',
        [id],
      );
      if (!r || Number(r.student_id) !== actor.userId)
        throw new NotFoundException('Không có yêu cầu thuộc tài khoản.');
      if (r.order_status === 'PAID' || r.status === 'APPROVED') return;
      if (r.order_status !== 'PENDING')
        throw new ConflictException('Đơn hàng không còn chờ thanh toán.');
      if (r.status === 'REVIEW') return;
      await m.query(
        "UPDATE payment.manual_requests SET status='REVIEW',learner_note=$2,reported_at=now(),updated_at=now() WHERE request_id=$1",
        [id, transactionCode],
      );
      await m.query(
        "INSERT INTO payment.manual_events(request_id,actor_id,action) VALUES($1,$2,'REPORTED')",
        [id, actor.userId],
      );
    });
    return {
      message:
        'Đã gửi yêu cầu đối soát. Quyền học mở sau khi quản trị viên xác nhận đã nhận đủ học phí.',
    };
  }
  async list(actor: Actor, status?: string) {
    this.admin(actor);
    if (
      status &&
      !['PENDING', 'REVIEW', 'APPROVED', 'REJECTED'].includes(status)
    )
      throw new BadRequestException('Bộ lọc không hợp lệ.');
    return {
      mode: this.mode(),
      walletConfigured: !!(await this.wallet()),
      requests: await this.db.query(
        `SELECT r.request_id AS id,r.order_id AS "orderId",r.method,r.reference,r.status,CASE WHEN r.method='MOMO_WALLET' THEN jsonb_build_object('receiverName',r.bank_snapshot->>'receiverName','receiverPhone',r.bank_snapshot->>'receiverPhone') ELSE r.bank_snapshot END AS bank,r.learner_note AS "learnerNote",r.reviewer_note AS "reviewerNote",r.created_at AS "createdAt",r.reported_at AS "reportedAt",o.final_amount AS amount,o.status AS "orderStatus",c.course_name AS course,u.full_name AS learner,u.is_test_account AS "isTestAccount" FROM payment.manual_requests r JOIN payment.orders o USING(order_id) JOIN lms.courses c ON c.course_id=o.course_id JOIN auth.users u ON u.user_id=o.student_id WHERE ($1='' OR r.status=$1) ORDER BY (r.status='REVIEW') DESC,r.created_at DESC LIMIT 200`,
        [status || ''],
      ),
    };
  }
  async review(actor: Actor, id: string, b: any) {
    this.admin(actor);
    this.id(id);
    b = {
      ...b,
      note: typeof b?.note === 'string' ? b.note.trim() : '',
      transactionCode:
        typeof b?.transactionCode === 'string'
          ? b.transactionCode.trim().replace(/^#\s*/, '')
          : '',
    };
    if (b.decision === 'APPROVE' && !b.note)
      b.note = 'Đã đối chiếu giao dịch và nhận đủ học phí.';
    if (
      !['APPROVE', 'REJECT'].includes(b?.decision) ||
      typeof b.note !== 'string' ||
      b.note.trim().length < 5 ||
      b.note.length > 1000
    )
      throw new BadRequestException(
        'Chọn quyết định và ghi chú đối soát từ 5 đến 1.000 ký tự.',
      );
    try {
      await this.db.transaction(async (m) => {
        const [r] = await m.query(
          'SELECT r.*,o.final_amount,o.status order_status,o.student_id,o.course_id FROM payment.manual_requests r JOIN payment.orders o USING(order_id) WHERE request_id=$1 FOR UPDATE OF r,o',
          [id],
        );
        if (!r) throw new NotFoundException('Yêu cầu không tồn tại.');
        if (r.status === 'APPROVED' && b.decision === 'APPROVE') return;
        if (r.order_status !== 'PENDING' || r.status === 'APPROVED')
          throw new ConflictException('Đơn hàng đã được xử lý hoặc đã đóng.');
        if (b.decision === 'APPROVE') {
          if (r.status !== 'REVIEW')
            throw new ConflictException(
              'Học viên chưa gửi yêu cầu đối soát cho đơn này.',
            );
          if (b.verified !== true)
            throw new BadRequestException(
              'Hãy xác nhận đã kiểm tra giao dịch thực nhận.',
            );
          if (
            !Number.isSafeInteger(b.receivedAmount) ||
            b.receivedAmount !== Number(r.final_amount)
          )
            throw new BadRequestException(
              `Số tiền chưa khớp. Đơn này cần ${Number(r.final_amount).toLocaleString('vi-VN')} đồng.`,
            );
          if (b.receivedReference !== r.reference)
            throw new BadRequestException(
              'Mã đơn đối soát chưa khớp. Hãy làm mới danh sách đơn hàng.',
            );
          if (
            b.verified !== true ||
            !Number.isSafeInteger(b.receivedAmount) ||
            b.receivedAmount !== Number(r.final_amount) ||
            b.receivedReference !== r.reference ||
            typeof b.transactionCode !== 'string' ||
            !/^[A-Za-z0-9_.:/-]{4,120}$/.test(b.transactionCode)
          )
            throw new BadRequestException(
              'Cần xác nhận đã đối chiếu tiền/biên nhận, đúng số tiền, mã nội dung và mã giao dịch hợp lệ.',
            );
          const provider =
            r.method === 'MOMO_WALLET'
              ? 'MOMO_PERSONAL'
              : r.method === 'BANK_TRANSFER'
                ? 'VEDU_BANK_MANUAL'
                : 'VEDU_CASH';
          const [p] = await m.query(
            "INSERT INTO payment.payments(order_id,amount,currency,payment_method,provider,transaction_code,status,paid_at,provider_payload) VALUES($1,$2,'VND',$3,$4,$5,'PAID',now(),$6::jsonb) RETURNING payment_id",
            [
              r.order_id,
              r.final_amount,
              r.method === 'MOMO_WALLET' ? 'MOMO' : r.method,
              provider,
              b.transactionCode,
              JSON.stringify({
                requestId: id,
                reviewedBy: actor.userId,
                receivedReference: b.receivedReference,
                note: b.note.trim(),
              }),
            ],
          );
          await m.query(
            "UPDATE payment.manual_requests SET status='APPROVED',payment_id=$2,reviewed_by=$3,reviewed_at=now(),reviewer_note=$4,updated_at=now() WHERE request_id=$1",
            [id, p.payment_id, actor.userId, b.note.trim()],
          );
          await m.query(
            "INSERT INTO auth.notifications(user_id,title,body,route) VALUES($1,'Học phí đã được xác nhận','Quyền học của bạn đã được mở.',$2)",
            [r.student_id, `/courses/${r.course_id}`],
          );
        } else {
          await m.query(
            "UPDATE payment.manual_requests SET status='REJECTED',reviewed_by=$2,reviewed_at=now(),reviewer_note=$3,updated_at=now() WHERE request_id=$1",
            [id, actor.userId, b.note.trim()],
          );
        }
        await m.query(
          'INSERT INTO payment.manual_events(request_id,actor_id,action,details) VALUES($1,$2,$3,$4::jsonb)',
          [
            id,
            actor.userId,
            b.decision,
            JSON.stringify({ note: b.note.trim() }),
          ],
        );
      });
    } catch (e) {
      if ((e as { code?: string }).code === '23505')
        throw new ConflictException(
          'Mã giao dịch/biên nhận đã được dùng. Không thể xác nhận hai đơn bằng cùng một giao dịch.',
        );
      throw e;
    }
    return {
      message:
        b.decision === 'APPROVE'
          ? 'Đã xác nhận học phí và mở quyền học.'
          : 'Đã trả lại yêu cầu; học viên xem ghi chú và gửi đối soát lại.',
    };
  }
}
