import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import * as bcrypt from 'bcryptjs';

import { User, UserRole } from '../entities/user.entity';

import { UserSession } from '../entities/user-session.entity';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { access, mkdir, unlink, writeFile } from 'fs/promises';
import { resolve } from 'path';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
  ) {}

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

  async uploadAvatar(userId: number, buffer?: Buffer) {
    if (!buffer?.length || buffer.length > 5 * 1024 * 1024)
      throw new BadRequestException('Chọn ảnh JPG, PNG hoặc WebP tối đa 5 MB');
    const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const png = buffer
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const webp =
      buffer.subarray(0, 4).toString() === 'RIFF' &&
      buffer.subarray(8, 12).toString() === 'WEBP';
    if (!jpeg && !png && !webp)
      throw new BadRequestException(
        'Nội dung tệp không phải ảnh JPG, PNG hoặc WebP hợp lệ',
      );
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) throw new NotFoundException('Tài khoản không tồn tại');
    let image: Buffer;
    try {
      image = await sharp(buffer, {
        limitInputPixels: 25000000,
        failOn: 'warning',
        pages: 1,
      })
        .rotate()
        .resize(256, 256, { fit: 'cover' })
        .jpeg({ quality: 85 })
        .toBuffer();
    } catch {
      throw new BadRequestException(
        'Không đọc được ảnh hoặc ảnh vượt 25 megapixel',
      );
    }
    const dir = resolve(process.env.MEDIA_DIR || './media', 'avatars');
    await mkdir(dir, { recursive: true });
    const filename = `${userId}-${randomUUID()}.jpg`,
      path = resolve(dir, filename),
      previous = user.avatarUrl;
    await writeFile(path, image, { flag: 'wx' });
    user.avatarUrl = `/api/users/avatars/${filename}`;
    try {
      await this.userRepository.save(user);
    } catch (error) {
      await unlink(path).catch(() => {});
      throw error;
    }
    // Remove only an older generated avatar belonging to this same account.
    if (
      previous &&
      new RegExp(`^/api/users/avatars/${userId}-[a-f0-9-]{36}\\.jpg$`).test(
        previous,
      )
    )
      await unlink(resolve(dir, previous.split('/').pop()!)).catch(() => {});
    return this.publicUser(user);
  }

  async avatarPath(filename: string) {
    if (!/^\d+-[a-f0-9-]{36}\.jpg$/.test(filename))
      throw new NotFoundException('Ảnh không tồn tại');
    const path = resolve(
      process.env.MEDIA_DIR || './media',
      'avatars',
      filename,
    );
    try {
      await access(path);
    } catch {
      throw new NotFoundException('Ảnh không tồn tại');
    }
    return path;
  }

  async findAll() {
    const users = await this.userRepository.find({
      order: {
        userId: 'ASC',
      },
    });

    return users.map((user) => this.publicUser(user));
  }

  async findOne(userId: number) {
    const user = await this.userRepository.findOne({
      where: {
        userId,
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} không tồn tại`);
    }

    return this.publicUser(user);
  }

  async create(
    fullName: string,
    username: string,
    email: string,
    phone: string,
    password: string,
    role: UserRole = 'STUDENT',
  ) {
    const normalizedName = fullName?.trim();

    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedUsername = username?.trim().toLowerCase();
    const normalizedPhone = phone?.replace(/[\s.-]/g, '');
    if (
      !['STUDENT', 'TEACHER', 'ADMIN'].includes(role) ||
      !/^[a-z0-9._]{4,30}$/.test(normalizedUsername ?? '') ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail ?? '') ||
      !/^(?:0|\+84)\d{9}$/.test(normalizedPhone ?? '') ||
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/.test(password ?? '')
    )
      throw new BadRequestException(
        'Username, email, điện thoại, mật khẩu hoặc vai trò không hợp lệ',
      );

    if (
      !normalizedName ||
      !normalizedUsername ||
      !normalizedEmail ||
      !normalizedPhone ||
      !password
    ) {
      throw new BadRequestException(
        'Vui lòng nhập đầy đủ họ tên, username, email, số điện thoại và mật khẩu',
      );
    }

    const existingUser = await this.userRepository
      .createQueryBuilder('u')
      .where(
        'LOWER(u.email) = LOWER(:email) OR LOWER(u.username) = LOWER(:username)',
        { email: normalizedEmail, username: normalizedUsername },
      )
      .getOne();

    if (existingUser) {
      throw new BadRequestException('Email hoặc username đã được sử dụng');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      fullName: normalizedName,
      username: normalizedUsername,
      email: normalizedEmail,
      phone: normalizedPhone,
      passwordHash,
      role,
      isActive: true,
    });

    const saved = await this.userRepository.save(user);

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
    const user = await this.userRepository.findOne({
      where: {
        userId,
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} không tồn tại`);
    }

    if (data.fullName !== undefined) {
      const fullName = data.fullName.trim();

      if (!fullName) {
        throw new BadRequestException('Họ tên không được để trống');
      }

      user.fullName = fullName;
    }

    if (data.email !== undefined) {
      const email = data.email.trim().toLowerCase();

      if (!email) {
        throw new BadRequestException('Email không được để trống');
      }

      const existing = await this.userRepository
        .createQueryBuilder('u')
        .where('LOWER(u.email) = LOWER(:email)', { email })
        .andWhere('u.user_id <> :userId', { userId })
        .getOne();

      if (existing) {
        throw new BadRequestException('Email đã được sử dụng');
      }

      user.email = email;
    }

    if (data.avatarUrl !== undefined) {
      user.avatarUrl = data.avatarUrl?.trim() || null;
    }

    const saved = await this.userRepository.save(user);

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
    const user = await this.userRepository.findOne({
      where: {
        userId,
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} không tồn tại`);
    }

    if (data.fullName !== undefined) {
      const fullName = data.fullName.trim();

      if (!fullName) {
        throw new BadRequestException('Họ tên không được để trống');
      }

      user.fullName = fullName;
    }

    if (data.email !== undefined) {
      const email = data.email.trim().toLowerCase();

      const existing = await this.userRepository
        .createQueryBuilder('u')
        .where('LOWER(u.email) = LOWER(:email)', { email })
        .andWhere('u.user_id <> :userId', { userId })
        .getOne();

      if (existing) {
        throw new BadRequestException('Email đã được sử dụng');
      }

      user.email = email;
    }

    if (data.avatarUrl !== undefined) {
      user.avatarUrl = data.avatarUrl?.trim() || null;
    }

    if (
      data.role !== undefined &&
      !['STUDENT', 'TEACHER', 'ADMIN'].includes(data.role)
    )
      throw new BadRequestException('Vai trò không hợp lệ');
    if (data.isActive !== undefined && typeof data.isActive !== 'boolean')
      throw new BadRequestException('Trạng thái phải là boolean');
    if (
      user.role === 'ADMIN' &&
      (data.isActive === false ||
        (data.role !== undefined && data.role !== 'ADMIN'))
    ) {
      const otherAdmins = await this.userRepository
        .createQueryBuilder('u')
        .where('u.role = :role AND u.is_active = TRUE AND u.user_id <> :id', {
          role: 'ADMIN',
          id: userId,
        })
        .getCount();
      if (!otherAdmins)
        throw new BadRequestException(
          'Không thể khóa hoặc đổi vai trò quản trị viên cuối cùng',
        );
    }
    const roleChanged = data.role !== undefined && data.role !== user.role;
    if (data.role !== undefined) {
      user.role = data.role;
    }

    if (data.isActive !== undefined) {
      user.isActive = data.isActive;
    }

    const saved = await this.userRepository.save(user);

    if (saved.isActive === false || roleChanged) {
      await this.sessionRepository
        .createQueryBuilder()
        .update(UserSession)
        .set({
          revokedAt: new Date(),
        })
        .where('user_id = :userId', { userId })
        .andWhere('revoked_at IS NULL')
        .execute();
    }

    return this.publicUser(saved);
  }
}
