import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';

import { Request } from 'express';

import { UsersService } from './users.service';

import {
    JwtAuthGuard,
} from '../auth/jwt-auth.guard';

import {
    RolesGuard,
} from '../auth/roles.guard';

import {
    Roles,
} from '../auth/roles.decorator';

import {
    UserRole,
} from '../entities/user.entity';

type AuthenticatedRequest = Request & {
    user: {
        userId: number;
        email: string;
        role: UserRole;
    };
};

@Controller('api/users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    getMe(
        @Req() request: AuthenticatedRequest,
    ) {
        return this.usersService.findOne(
            request.user.userId,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Patch('me')
    updateMe(
        @Req() request: AuthenticatedRequest,
        @Body()
        body: {
            fullName?: string;
            email?: string;
            avatarUrl?: string | null;
        },
    ) {
        return this.usersService.updateMe(
            request.user.userId,
            body,
        );
    }

    @UseGuards(
        JwtAuthGuard,
        RolesGuard,
    )
    @Roles('ADMIN')
    @Get()
    findAll() {
        return this.usersService.findAll();
    }

    @UseGuards(
        JwtAuthGuard,
        RolesGuard,
    )
    @Roles('ADMIN')
    @Post()
    create(
        @Body()
        body: {
            fullName: string;
            email: string;
            password: string;
            role?: UserRole;
        },
    ) {
        return this.usersService.create(
            body.fullName,
            body.email,
            body.password,
            body.role ?? 'STUDENT',
        );
    }

    @UseGuards(
        JwtAuthGuard,
        RolesGuard,
    )
    @Roles('ADMIN')
    @Get(':id')
    findOne(
        @Param(
            'id',
            ParseIntPipe,
        )
        id: number,
    ) {
        return this.usersService.findOne(id);
    }

    @UseGuards(
        JwtAuthGuard,
        RolesGuard,
    )
    @Roles('ADMIN')
    @Patch(':id')
    adminUpdate(
        @Param(
            'id',
            ParseIntPipe,
        )
        id: number,

        @Body()
        body: {
            fullName?: string;
            email?: string;
            avatarUrl?: string | null;
            role?: UserRole;
            isActive?: boolean;
        },
    ) {
        return this.usersService.adminUpdate(
            id,
            body,
        );
    }
}