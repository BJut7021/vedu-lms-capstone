import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
    IsNull,
    Repository,
} from 'typeorm';

import * as bcrypt from 'bcryptjs';

import {
    User,
    UserRole,
} from '../entities/user.entity';

import { UserSession } from '../entities/user-session.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(UserSession)
        private readonly sessionRepository: Repository<UserSession>,
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

    async findAll() {
        const users =
            await this.userRepository.find({
                order: {
                    userId: 'ASC',
                },
            });

        return users.map(
            (user) => this.publicUser(user),
        );
    }

    async findOne(
        userId: number,
    ) {
        const user =
            await this.userRepository.findOne({
                where: {
                    userId,
                },
            });

        if (!user) {
            throw new NotFoundException(
                `User ${userId} không tồn tại`,
            );
        }

        return this.publicUser(user);
    }

    async create(
        fullName: string,
        email: string,
        password: string,
        role: UserRole = 'STUDENT',
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
            await bcrypt.hash(
                password,
                10,
            );

        const user =
            this.userRepository.create({
                fullName: normalizedName,
                email: normalizedEmail,
                passwordHash,
                role,
                isActive: true,
            });

        const saved =
            await this.userRepository.save(
                user,
            );

        return this.publicUser(saved);
    }

    async updateMe(
        userId: number,
        data: {
            fullName?: string;
            email?: string;
            avatarUrl?: string | null;
        },
    ) {
        const user =
            await this.userRepository.findOne({
                where: {
                    userId,
                },
            });

        if (!user) {
            throw new NotFoundException(
                `User ${userId} không tồn tại`,
            );
        }

        if (data.fullName !== undefined) {
            const fullName =
                data.fullName.trim();

            if (!fullName) {
                throw new BadRequestException(
                    'Họ tên không được để trống',
                );
            }

            user.fullName = fullName;
        }

        if (data.email !== undefined) {
            const email =
                data.email.trim().toLowerCase();

            if (!email) {
                throw new BadRequestException(
                    'Email không được để trống',
                );
            }

            const existing =
                await this.userRepository
                    .createQueryBuilder('u')
                    .where(
                        'LOWER(u.email) = LOWER(:email)',
                        { email },
                    )
                    .andWhere(
                        'u.user_id <> :userId',
                        { userId },
                    )
                    .getOne();

            if (existing) {
                throw new BadRequestException(
                    'Email đã được sử dụng',
                );
            }

            user.email = email;
        }

        if (data.avatarUrl !== undefined) {
            user.avatarUrl =
                data.avatarUrl?.trim() || null;
        }

        const saved =
            await this.userRepository.save(
                user,
            );

        return this.publicUser(saved);
    }

    async adminUpdate(
        userId: number,
        data: {
            fullName?: string;
            email?: string;
            avatarUrl?: string | null;
            role?: UserRole;
            isActive?: boolean;
        },
    ) {
        const user =
            await this.userRepository.findOne({
                where: {
                    userId,
                },
            });

        if (!user) {
            throw new NotFoundException(
                `User ${userId} không tồn tại`,
            );
        }

        if (data.fullName !== undefined) {
            const fullName =
                data.fullName.trim();

            if (!fullName) {
                throw new BadRequestException(
                    'Họ tên không được để trống',
                );
            }

            user.fullName = fullName;
        }

        if (data.email !== undefined) {
            const email =
                data.email.trim().toLowerCase();

            const existing =
                await this.userRepository
                    .createQueryBuilder('u')
                    .where(
                        'LOWER(u.email) = LOWER(:email)',
                        { email },
                    )
                    .andWhere(
                        'u.user_id <> :userId',
                        { userId },
                    )
                    .getOne();

            if (existing) {
                throw new BadRequestException(
                    'Email đã được sử dụng',
                );
            }

            user.email = email;
        }

        if (data.avatarUrl !== undefined) {
            user.avatarUrl =
                data.avatarUrl?.trim() || null;
        }

        if (data.role !== undefined) {
            user.role = data.role;
        }

        if (data.isActive !== undefined) {
            user.isActive = data.isActive;
        }

        const saved =
            await this.userRepository.save(
                user,
            );

        if (saved.isActive === false) {
            await this.sessionRepository
                .createQueryBuilder()
                .update(UserSession)
                .set({
                    revokedAt: new Date(),
                })
                .where(
                    'user_id = :userId',
                    { userId },
                )
                .andWhere(
                    'revoked_at IS NULL',
                )
                .execute();
        }

        return this.publicUser(saved);
    }
}