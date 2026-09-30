import {
    BadRequestException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

import { randomUUID } from 'crypto';

import { User } from '../entities/user.entity';
import { UserSession } from '../entities/user-session.entity';

@Injectable()
export class AuthService {
    private readonly refreshDays = 30;

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(UserSession)
        private readonly sessionRepository: Repository<UserSession>,

        private readonly jwtService: JwtService,
    ) { }

    private publicUser(user: User) {
        return {
            userId: user.userId,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatarUrl,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    async register(
        fullName: string,
        email: string,
        password: string,
    ) {
        const normalizedName =
            fullName?.trim();

        const normalizedEmail =
            email?.trim().toLowerCase();

        if (
            !normalizedName ||
            !normalizedEmail ||
            !password
        ) {
            throw new BadRequestException(
                'Vui lòng nhập đầy đủ họ tên, email và mật khẩu',
            );
        }

        if (password.length < 6) {
            throw new BadRequestException(
                'Mật khẩu phải có ít nhất 6 ký tự',
            );
        }

        const existingUser =
            await this.userRepository
                .createQueryBuilder('u')
                .where(
                    'LOWER(u.email) = LOWER(:email)',
                    { email: normalizedEmail },
                )
                .getOne();

        if (existingUser) {
            throw new BadRequestException(
                'Email đã được sử dụng',
            );
        }

        const passwordHash =
            await bcrypt.hash(password, 10);

        const user =
            this.userRepository.create({
                fullName: normalizedName,
                email: normalizedEmail,
                passwordHash,
                role: 'STUDENT',
                isActive: true,
            });

        const savedUser =
            await this.userRepository.save(user);

        return {
            message: 'Đăng ký thành công',
            user: this.publicUser(savedUser),
        };
    }

    async login(
        email: string,
        password: string,
        deviceInfo?: string,
        ipAddress?: string,
        userAgent?: string,
    ) {
        const normalizedEmail =
            email?.trim().toLowerCase();

        if (!normalizedEmail || !password) {
            throw new BadRequestException(
                'Vui lòng nhập email và mật khẩu',
            );
        }

        const user =
            await this.userRepository
                .createQueryBuilder('u')
                .where(
                    'LOWER(u.email) = LOWER(:email)',
                    { email: normalizedEmail },
                )
                .getOne();

        if (!user) {
            throw new UnauthorizedException(
                'Email hoặc mật khẩu không đúng',
            );
        }

        if (!user.isActive) {
            throw new UnauthorizedException(
                'Tài khoản đã bị khóa',
            );
        }

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.passwordHash,
            );

        if (!passwordMatch) {
            throw new UnauthorizedException(
                'Email hoặc mật khẩu không đúng',
            );
        }

        const sessionId =
            randomUUID();

        const refreshToken =
            await this.jwtService.signAsync(
                {
                    sub: user.userId,
                    email: user.email,
                    role: user.role,
                    type: 'refresh',
                    sessionId,
                },
                {
                    expiresIn: '30d',
                },
            );

        const refreshTokenHash =
            await bcrypt.hash(
                refreshToken,
                10,
            );

        const expiresAt =
            new Date(
                Date.now() +
                this.refreshDays *
                24 *
                60 *
                60 *
                1000,
            );

        const session =
            this.sessionRepository.create({
                sessionId,
                userId: user.userId,
                refreshTokenHash,
                deviceInfo:
                    deviceInfo?.trim() || null,
                ipAddress:
                    ipAddress || null,
                userAgent:
                    userAgent || null,
                expiresAt,
                revokedAt: null,
                lastUsedAt: new Date(),
            });

        await this.sessionRepository.save(
            session,
        );

        const accessToken =
            await this.jwtService.signAsync(
                {
                    sub: user.userId,
                    email: user.email,
                    role: user.role,
                    type: 'access',
                },
                {
                    expiresIn: '15m',
                },
            );

        return {
            message: 'Đăng nhập thành công',
            accessToken,
            refreshToken,
            expiresIn: 900,
            sessionId,
            user: this.publicUser(user),
        };
    }

    async refresh(
        refreshToken: string,
    ) {
        if (!refreshToken?.trim()) {
            throw new BadRequestException(
                'Thiếu refresh token',
            );
        }

        let payload: any;

        try {
            payload =
                await this.jwtService.verifyAsync(
                    refreshToken,
                );
        } catch {
            throw new UnauthorizedException(
                'Refresh token không hợp lệ hoặc đã hết hạn',
            );
        }

        if (
            payload.type !== 'refresh' ||
            !payload.sessionId
        ) {
            throw new UnauthorizedException(
                'Refresh token không hợp lệ',
            );
        }

        const session =
            await this.sessionRepository.findOne({
                where: {
                    sessionId: payload.sessionId,
                },
            });

        if (!session) {
            throw new UnauthorizedException(
                'Session không tồn tại',
            );
        }

        if (
            session.revokedAt ||
            session.expiresAt.getTime() <= Date.now()
        ) {
            throw new UnauthorizedException(
                'Session đã hết hạn hoặc bị thu hồi',
            );
        }

        const validToken =
            await bcrypt.compare(
                refreshToken,
                session.refreshTokenHash,
            );

        if (!validToken) {
            throw new UnauthorizedException(
                'Refresh token không hợp lệ',
            );
        }

        const user =
            await this.userRepository.findOne({
                where: {
                    userId: session.userId,
                },
            });

        if (!user || !user.isActive) {
            throw new UnauthorizedException(
                'Tài khoản không tồn tại hoặc đã bị khóa',
            );
        }

        const newRefreshToken =
            await this.jwtService.signAsync(
                {
                    sub: user.userId,
                    email: user.email,
                    role: user.role,
                    type: 'refresh',
                    sessionId: session.sessionId,
                },
                {
                    expiresIn: '30d',
                },
            );

        session.refreshTokenHash =
            await bcrypt.hash(
                newRefreshToken,
                10,
            );

        session.lastUsedAt =
            new Date();

        session.expiresAt =
            new Date(
                Date.now() +
                this.refreshDays *
                24 *
                60 *
                60 *
                1000,
            );

        await this.sessionRepository.save(
            session,
        );

        const accessToken =
            await this.jwtService.signAsync(
                {
                    sub: user.userId,
                    email: user.email,
                    role: user.role,
                    type: 'access',
                },
                {
                    expiresIn: '15m',
                },
            );

        return {
            accessToken,
            refreshToken: newRefreshToken,
            expiresIn: 900,
            sessionId: session.sessionId,
            user: this.publicUser(user),
        };
    }

    async revokeByRefreshToken(
        refreshToken: string,
    ) {
        if (!refreshToken?.trim()) {
            throw new BadRequestException(
                'Thiếu refresh token',
            );
        }

        let payload: any;

        try {
            payload =
                await this.jwtService.verifyAsync(
                    refreshToken,
                );
        } catch {
            throw new UnauthorizedException(
                'Refresh token không hợp lệ',
            );
        }

        const session =
            await this.sessionRepository.findOne({
                where: {
                    sessionId: payload.sessionId,
                },
            });

        if (!session) {
            throw new NotFoundException(
                'Session không tồn tại',
            );
        }

        const validToken =
            await bcrypt.compare(
                refreshToken,
                session.refreshTokenHash,
            );

        if (!validToken) {
            throw new UnauthorizedException(
                'Refresh token không hợp lệ',
            );
        }

        session.revokedAt =
            new Date();

        await this.sessionRepository.save(
            session,
        );

        return {
            message: 'Đã đăng xuất và thu hồi session',
        };
    }

    async getSessions(
        userId: number,
    ) {
        return this.sessionRepository.find({
            where: {
                userId,
            },
            order: {
                createdAt: 'DESC',
            },
            select: {
                sessionId: true,
                userId: true,
                deviceInfo: true,
                ipAddress: true,
                userAgent: true,
                expiresAt: true,
                revokedAt: true,
                lastUsedAt: true,
                createdAt: true,
            },
        });
    }

    async revokeSession(
        userId: number,
        sessionId: string,
    ) {
        const session =
            await this.sessionRepository.findOne({
                where: {
                    sessionId,
                    userId,
                },
            });

        if (!session) {
            throw new NotFoundException(
                'Session không tồn tại',
            );
        }

        session.revokedAt =
            new Date();

        await this.sessionRepository.save(
            session,
        );

        return {
            message: 'Đã thu hồi session',
            sessionId,
        };
    }
}