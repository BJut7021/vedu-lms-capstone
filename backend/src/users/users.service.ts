import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async findAll(): Promise<User[]> {
        return this.userRepository.find();
    }

    async create(
        fullName: string,
        email: string,
        password: string,
        role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'STUDENT',
    ): Promise<User> {
        const passwordHash = await bcrypt.hash(password, 10);

        const user = this.userRepository.create({
            fullName,
            email,
            passwordHash,
            role,
        });

        return this.userRepository.save(user);
    }
}