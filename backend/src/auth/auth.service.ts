import {
    BadRequestException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSource } from 'typeorm';

import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

import { createHash, randomInt, randomUUID } from 'crypto';
import * as nodemailer from 'nodemailer';

import { User, UserRole } from '../entities/user.entity';
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

        private readonly dataSource: DataSource,
    ) { }

    private readonly accessTokenSeconds = 3 * 24 * 60 * 60;

    private publicUser(user: User) {
        return {
            userId: user.userId,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            phone: user.phone,
            role: user.role,
            avatarUrl: user.avatarUrl,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    async register(data: {
        fullName: string;
        username: string;
        email: string;
        phone: string;
        password: string;
        confirmPassword: string;
    }) {
        const normalizedName = data.fullName?.trim();
        const normalizedUsername = data.username?.trim().toLowerCase();
        const normalizedEmail = data.email?.trim().toLowerCase();
        const normalizedPhone = data.phone?.replace(/[\s.-]/g, '');

        if (
            !normalizedName ||
            !normalizedUsername ||
            !normalizedEmail ||
            !normalizedPhone ||
            !data.password ||
            !data.confirmPassword
        ) {
            throw new BadRequestException(
                'Vui lòng nhập đầy đủ họ tên, username, email, số điện thoại và mật khẩu',
            );
        }

        if (normalizedName.length < 2 || normalizedName.length > 120) {
            throw new BadRequestException('Họ tên phải có từ 2 đến 120 ký tự');
        }
        if (!/^[a-z0-9._]{4,30}$/.test(normalizedUsername)) {
            throw new BadRequestException(
                'Username gồm 4-30 ký tự chữ thường, số, dấu chấm hoặc gạch dưới',
            );
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            throw new BadRequestException('Email không đúng định dạng');
        }
        if (!/^(?:0|\+84)\d{9}$/.test(normalizedPhone)) {
            throw new BadRequestException('Số điện thoại Việt Nam không đúng định dạng');
        }
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/.test(data.password)) {
            throw new BadRequestException(
                'Mật khẩu phải có 8-72 ký tự, gồm chữ hoa, chữ thường và chữ số',
            );
        }
        if (data.password !== data.confirmPassword) {
            throw new BadRequestException('Mật khẩu nhập lại không khớp');
        }

        const existingUser =
            await this.userRepository
                .createQueryBuilder('u')
                .where(
                    'LOWER(u.email) = :email OR LOWER(u.username) = :username',
                    { email: normalizedEmail, username: normalizedUsername },
                )
                .getOne();

        if (existingUser) {
            throw new BadRequestException(
                existingUser.username?.toLowerCase() === normalizedUsername
                    ? 'Username đã tồn tại'
                    : 'Email đã được sử dụng',
            );
        }

        const passwordHash =
            await bcrypt.hash(data.password, 10);

        const user =
            this.userRepository.create({
                fullName: normalizedName,
                username: normalizedUsername,
                email: normalizedEmail,
                phone: normalizedPhone,
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

    async usernameAvailability(username: string) {
        const normalized = username?.trim().toLowerCase();
        const valid = /^[a-z0-9._]{4,30}$/.test(normalized);
        if (!valid) return { username: normalized, available: false, valid: false };

        const count = await this.userRepository
            .createQueryBuilder('u')
            .where('LOWER(u.username) = :username', { username: normalized })
            .getCount();
        return { username: normalized, available: count === 0, valid: true };
    }

    async login(
        username: string,
        password: string,
        expectedRole: UserRole,
        deviceInfo?: string,
        ipAddress?: string,
        userAgent?: string,
    ) {
        const normalizedUsername = username?.trim().toLowerCase();

        if (!normalizedUsername || !password) {
            throw new BadRequestException(
                'Vui lòng nhập username và mật khẩu',
            );
        }

        if (!['STUDENT', 'TEACHER', 'ADMIN'].includes(expectedRole)) {
            throw new BadRequestException('Cổng đăng nhập không hợp lệ');
        }

        const user =
            await this.userRepository
                .createQueryBuilder('u')
                .where(
                    'LOWER(u.username) = :username',
                    { username: normalizedUsername },
                )
                .getOne();

        if (!user) {
            throw new UnauthorizedException(
                'Username hoặc mật khẩu không đúng',
            );
        }

        if (!user.isActive) {
            throw new UnauthorizedException(
                'Tài khoản đã bị khóa',
            );
        }


        if (user.role !== expectedRole) {
            throw new UnauthorizedException(
                `Tài khoản này không thuộc cổng ${expectedRole}`,
            );
        }

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.passwordHash,
            );

        if (!passwordMatch) {
            throw new UnauthorizedException(
                'Username hoặc mật khẩu không đúng',
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
                    expiresIn: '3d',
                },
            );

        return {
            message: 'Đăng nhập thành công',
            accessToken,
            refreshToken,
            expiresIn: this.accessTokenSeconds,
            expiresInSeconds: this.accessTokenSeconds,
            sessionId,
            user: this.publicUser(user),
        };
    }

    async forgotPassword(email: string, expectedRole: UserRole) {
        const normalizedEmail = email?.trim().toLowerCase();
        if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            throw new BadRequestException('Email không đúng định dạng');
        }
        if (!['STUDENT', 'TEACHER'].includes(expectedRole)) {
            throw new BadRequestException(
                'Cổng quản trị viên không hỗ trợ quên mật khẩu',
            );
        }

        const response: {
            message: string;
            expiresInSeconds: number;
            demoResetPin?: string;
        } = {
            message: 'Nếu email đúng với tài khoản, mã PIN đã được gửi.',
            expiresInSeconds: 900,
        };

        const user = await this.userRepository
            .createQueryBuilder('u')
            .where('LOWER(u.email) = :email AND u.role = :role', {
                email: normalizedEmail,
                role: expectedRole,
            })
            .getOne();

        if (!user || !user.isActive) return response;

        const resetPin = randomInt(100000, 1000000).toString();
        const tokenHash = createHash('sha256')
            .update(`${normalizedEmail}:${resetPin}`)
            .digest('hex');

        await this.dataSource.transaction(async (manager) => {
            await manager.query(`
                UPDATE auth.password_reset_tokens
                SET used_at = CURRENT_TIMESTAMP
                WHERE user_id = $1 AND used_at IS NULL
            `, [user.userId]);
            await manager.query(`
                INSERT INTO auth.password_reset_tokens(
                    user_id, token_hash, expires_at
                ) VALUES (
                    $1, $2, CURRENT_TIMESTAMP + INTERVAL '900 seconds'
                )
            `, [user.userId, tokenHash]);
        });

        const smtpHost = process.env.SMTP_HOST?.trim();
        const smtpUser = process.env.SMTP_USER?.trim();
        const smtpPass = process.env.SMTP_PASS;
        if (smtpHost && smtpUser && smtpPass) {
            const smtpPort = Number(process.env.SMTP_PORT || 587);
            const transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpPort === 465,
                auth: { user: smtpUser, pass: smtpPass },
            });
            await transporter.sendMail({
                from: process.env.SMTP_FROM || `Vedu LMS <${smtpUser}>`,
                to: user.email,
                subject: 'Mã PIN đặt lại mật khẩu Vedu LMS',
                text: `Mã PIN của bạn là ${resetPin}. Mã có hiệu lực 900 giây. Không chia sẻ mã này.`,
                html: `<p>Mã PIN đặt lại mật khẩu Vedu LMS:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${resetPin}</p><p>Mã có hiệu lực 900 giây. Không chia sẻ mã này.</p>`,
            });
        } else if (process.env.PASSWORD_RESET_DEMO_MODE !== 'true') {
            throw new BadRequestException(
                'Dịch vụ email chưa được cấu hình. Hãy cấu hình SMTP_HOST, SMTP_USER và SMTP_PASS.',
            );
        }

        if (process.env.PASSWORD_RESET_DEMO_MODE === 'true') {
            response.demoResetPin = resetPin;
        }

        return response;
    }

    async resetPassword(
        email: string,
        pin: string,
        newPassword: string,
        expectedRole: UserRole,
    ) {
        const normalizedEmail = email?.trim().toLowerCase();
        const normalizedPin = pin?.trim();
        if (!normalizedEmail || !/^\d{6}$/.test(normalizedPin)) {
            throw new BadRequestException('Email hoặc mã PIN 6 chữ số không hợp lệ');
        }
        if (!['STUDENT', 'TEACHER'].includes(expectedRole)) {
            throw new BadRequestException(
                'Cổng quản trị viên không hỗ trợ đặt lại mật khẩu',
            );
        }
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/.test(newPassword)) {
            throw new BadRequestException(
                'Mật khẩu mới phải có 8-72 ký tự, gồm chữ hoa, chữ thường và chữ số',
            );
        }

        const tokenHash = createHash('sha256')
            .update(`${normalizedEmail}:${normalizedPin}`)
            .digest('hex');
        const passwordHash = await bcrypt.hash(newPassword, 10);

        const updated = await this.dataSource.transaction(async (manager) => {
            const rows = await manager.query(`
                SELECT t.reset_token_id AS "resetTokenId", t.user_id AS "userId"
                FROM auth.password_reset_tokens t
                JOIN auth.users u ON u.user_id = t.user_id
                WHERE t.token_hash = $1
                  AND LOWER(u.email) = $2
                  AND u.role = $3
                  AND t.used_at IS NULL
                  AND t.expires_at > CURRENT_TIMESTAMP
                  AND u.is_active = TRUE
                FOR UPDATE OF t
            `, [tokenHash, normalizedEmail, expectedRole]);

            if (!rows.length) return false;

            const userId = rows[0].userId;
            await manager.query(`
                UPDATE auth.users
                SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $2
            `, [passwordHash, userId]);
            await manager.query(`
                UPDATE auth.password_reset_tokens
                SET used_at = CURRENT_TIMESTAMP
                WHERE user_id = $1 AND used_at IS NULL
            `, [userId]);
            await manager.query(`
                UPDATE auth.user_sessions
                SET revoked_at = CURRENT_TIMESTAMP
                WHERE user_id = $1 AND revoked_at IS NULL
            `, [userId]);

            return true;
        });

        if (!updated) {
            throw new BadRequestException(
                'Mã PIN không hợp lệ hoặc đã hết hạn',
            );
        }

        return {
            message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.',
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
                    expiresIn: '3d',
                },
            );

        return {
            accessToken,
            refreshToken: newRefreshToken,
            expiresIn: this.accessTokenSeconds,
            expiresInSeconds: this.accessTokenSeconds,
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
