import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AccessService } from './access.service';
// Legacy CRUD endpoints are administrative. Student/teacher workflows use scoped platform endpoints.
@Injectable()
export class ApiPolicyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly db: DataSource,
    private readonly access: AccessService,
  ) {}
  async canActivate(ctx: ExecutionContext) {
    if (
      this.reflector.getAllAndOverride('public', [
        ctx.getHandler(),
        ctx.getClass(),
      ])
    )
      return true;
    const req = ctx.switchToHttp().getRequest();
    const actor = req.user;
    const controller = ctx.getClass().name;
    const handler = ctx.getHandler().name;
    if (actor.isGuest) {
      const allowed: Record<string, string[]> = {
        AuthController: ['getSessions', 'revokeSession'],
        UsersController: ['getMe'],
        PortalController: ['overview'],
        EnrollmentController: ['enrollMe'],
        LearningController: ['logEvent'],
        PlatformController: [
          'classroom',
          'studyState',
          'media',
          'watch',
          'heartbeat',
          'checkoutStatus',
        ],
      };
      if (!allowed[controller]?.includes(handler))
        throw new ForbiddenException(
          'Chức năng này dành cho tài khoản đã đăng ký, không áp dụng cho khách',
        );
    }
    if (controller === 'EnrollmentController' && handler === 'enrollMe') {
      if (actor.role !== 'STUDENT')
        throw new ForbiddenException('Chỉ học viên được ghi danh');
      return true;
    }
    if (
      [
        'PaymentController',
        'EnrollmentController',
        'LessonsController',
      ].includes(controller)
    ) {
      if (actor.role !== 'ADMIN')
        throw new ForbiddenException(
          'API quản trị; hãy dùng chức năng thuộc tài khoản của bạn',
        );
    }
    if (controller === 'AssessmentController') {
      if (
        [
          'getPlayableQuiz',
          'createAttempt',
          'findAttempt',
          'submitAttempt',
        ].includes(handler)
      ) {
        let quizId = Number(req.params.quizId ?? req.params.id);
        if (req.params.attemptId) {
          const [attempt] = await this.db.query(
            'SELECT * FROM assessment.quiz_attempts WHERE attempt_id=$1',
            [req.params.attemptId],
          );
          if (!attempt || Number(attempt.student_id) !== actor.userId)
            throw new ForbiddenException('Bài làm không thuộc tài khoản');
          quizId = Number(attempt.quiz_id);
        }
        const [quiz] = await this.db.query(
          'SELECT course_id FROM assessment.quizzes WHERE quiz_id=$1 AND is_published AND NOT is_deleted',
          [quizId],
        );
        if (!quiz) throw new ForbiddenException('Bài thi chưa được công bố');
        await this.access.study(actor, Number(quiz.course_id));
      } else if (actor.role !== 'ADMIN')
        throw new ForbiddenException(
          'Dùng ngân hàng quiz có kiểm tra quyền sở hữu',
        );
    }
    if (controller === 'LearningController') {
      if (actor.role !== 'STUDENT')
        throw new ForbiddenException('Chỉ ghi log học viên');
      await this.access.study(actor, Number(req.body.courseId));
      if (req.body.lessonId)
        await this.access.lesson(
          actor,
          Number(req.body.courseId),
          Number(req.body.lessonId),
        );
    }
    return true;
  }
}
