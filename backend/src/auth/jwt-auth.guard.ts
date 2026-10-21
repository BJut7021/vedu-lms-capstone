import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';

import { User, UserRole } from '../entities/user.entity';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly reflector: Reflector,
    private readonly db: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (
      this.reflector.getAllAndOverride('public', [
        context.getHandler(),
        context.getClass(),
      ])
    )
      return true;
    if (request.user) return true;

    const mediaRequest =
      context.getClass().name === 'PlatformController' &&
      context.getHandler().name === 'media';
    const authorization =
      request.headers.authorization ||
      (mediaRequest && typeof request.query.ticket === 'string'
        ? `Bearer ${request.query.ticket}`
        : null);

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Thiếu access token');
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      throw new UnauthorizedException('Access token không hợp lệ');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);

      if (
        payload.type &&
        payload.type !== 'access' &&
        !(
          mediaRequest &&
          payload.type === 'media' &&
          Number(payload.resourceId) === Number(request.params.id)
        )
      ) {
        throw new UnauthorizedException('Token không phải access token');
      }

      const userId = Number(payload.sub);

      if (!Number.isInteger(userId)) {
        throw new UnauthorizedException('Token user không hợp lệ');
      }

      const user = await this.userRepository.findOne({
        where: {
          userId,
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException(
          'Tài khoản không tồn tại hoặc đã bị khóa',
        );
      }

      const [session] = await this.db.query(
        `SELECT session_id FROM auth.user_sessions
                WHERE session_id=$1 AND user_id=$2 AND revoked_at IS NULL AND expires_at>CURRENT_TIMESTAMP`,
        [payload.sessionId ?? null, userId],
      );
      if (!session)
        throw new UnauthorizedException(
          'Phiên đăng nhập đã bị thu hồi. Vui lòng đăng nhập lại',
        );
      request.user = {
        userId,
        sessionId: payload.sessionId,
        isGuest: user.username.startsWith('guest_'),
        email: user.email,
        role: user.role as UserRole,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException(
        'Access token không hợp lệ hoặc đã hết hạn',
      );
    }
  }
}
