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

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async canActivate(
        context: ExecutionContext,
    ): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        const authorization =
            request.headers.authorization;

        if (
            !authorization ||
            !authorization.startsWith('Bearer ')
        ) {
            throw new UnauthorizedException(
                'Thiếu access token',
            );
        }

        const token = authorization.slice(7).trim();

        if (!token) {
            throw new UnauthorizedException(
                'Access token không hợp lệ',
            );
        }

        try {
            const payload =
                await this.jwtService.verifyAsync(token);

            if (
                payload.type &&
                payload.type !== 'access'
            ) {
                throw new UnauthorizedException(
                    'Token không phải access token',
                );
            }

            const userId = Number(payload.sub);

            if (!Number.isInteger(userId)) {
                throw new UnauthorizedException(
                    'Token user không hợp lệ',
                );
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

            request.user = {
                userId: user.userId,
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