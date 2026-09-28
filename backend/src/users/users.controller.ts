import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('api/users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    findAll() {
        return this.usersService.findAll();
    }

    @Post()
    create(
        @Body()
        body: {
            fullName: string;
            email: string;
            password: string;
            role?: 'STUDENT' | 'TEACHER' | 'ADMIN';
        },
    ) {
        return this.usersService.create(
            body.fullName,
            body.email,
            body.password,
            body.role ?? 'STUDENT',
        );
    }
}