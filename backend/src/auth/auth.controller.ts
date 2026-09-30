import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import type { UserRole } from '../entities/user.entity';

type AuthenticatedRequest = Request & {
    user: {
        userId: number;
        email: string;
        role: UserRole;
    };
};

@Controller('api/auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) { }

    @Post('register')
    register(
        @Body()
        body: {
            fullName: string;
            email: string;
            password: string;
        },
    ) {
        return this.authService.register(
            body.fullName,
            body.email,
            body.password,
        );
    }

    @Post('login')
    login(
        @Req() request: Request,
        @Body()
        body: {
            email: string;
            password: string;
            deviceInfo?: string;
        },
    ) {
        return this.authService.login(
            body.email,
            body.password,
            body.deviceInfo,
            request.ip,
            request.headers['user-agent'],
        );
    }

    @Post('refresh')
    refresh(
        @Body()
        body: {
            refreshToken: string;
        },
    ) {
        return this.authService.refresh(
            body.refreshToken,
        );
    }

    @Post('revoke')
    revoke(
        @Body()
        body: {
            refreshToken: string;
        },
    ) {
        return this.authService.revokeByRefreshToken(
            body.refreshToken,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get('sessions')
    getSessions(
        @Req() request: AuthenticatedRequest,
    ) {
        return this.authService.getSessions(
            request.user.userId,
        );
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Delete('sessions/:sessionId')
    revokeSession(
        @Req() request: AuthenticatedRequest,
        @Param('sessionId') sessionId: string,
    ) {
        return this.authService.revokeSession(
            request.user.userId,
            sessionId,
        );
    }
}