import {
    BadRequestException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        private readonly jwtService: JwtService,
    ) { }

    async register(
        fullName: string,
        email: string,
        password: string,
    ) {
        if (!fullName || !email || !password) {
            throw new BadRequestException(
                'Vui lòng nhập đầy đủ họ tên, email và mật khẩu',
            );
        }

        const existingUser = await this.userRepository.findOne({
            where: {
                email,
            },
        });

        if (existingUser) {
            throw new BadRequestException(
                'Email đã được sử dụng',
            );
        }

        const passwordHash = await bcrypt.hash(
            password,
            10,
        );

        const user = this.userRepository.create({
            fullName,
            email,
            passwordHash,
            role: 'STUDENT',
        });

        const savedUser = await this.userRepository.save(user);

        return {
            message: 'Đăng ký thành công',
            user: {
                userId: savedUser.userId,
                fullName: savedUser.fullName,
                email: savedUser.email,
                role: savedUser.role,
            },
        };
    }

    async login(
        email: string,
        password: string,
    ) {
        if (!email || !password) {
            throw new BadRequestException(
                'Vui lòng nhập email và mật khẩu',
            );
        }

        const user = await this.userRepository.findOne({
            where: {
                email,
            },
        });

        if (!user) {
            throw new UnauthorizedException(
                'Email hoặc mật khẩu không đúng',
            );
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.passwordHash,
        );

        if (!passwordMatch) {
            throw new UnauthorizedException(
                'Email hoặc mật khẩu không đúng',
            );
        }

        const payload = {
            sub: user.userId,
            email: user.email,
            role: user.role,
        };

        const accessToken =
            await this.jwtService.signAsync(payload);

        return {
            message: 'Đăng nhập thành công',
            accessToken,
            user: {
                userId: user.userId,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
            },
        };
    }
}