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
import { Public } from './public.decorator';

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
    @Public()
    register(
        @Body()
        body: {
            fullName: string;
            username: string;
            email: string;
            phone: string;
            password: string;
            confirmPassword: string;
        },
    ) {
        return this.authService.register(body);
    }

    @Get('username-availability/:username')
    @Public()
    usernameAvailability(@Param('username') username: string) {
        return this.authService.usernameAvailability(username);
    }

    @Post('login')
    @Public()
    login(
        @Req() request: Request,
        @Body()
        body: {
            username: string;
            password: string;
            expectedRole: UserRole;
            deviceInfo?: string;
        },
    ) {
        return this.authService.login(
            body.username,
            body.password,
            body.expectedRole,
            body.deviceInfo,
            request.ip,
            request.headers['user-agent'],
        );
    }

    @Post('guest')
    @Public()
    guestLogin(
        @Req() request: Request,
        @Body() body: { expectedRole?: UserRole },
    ) {
        return this.authService.guestLogin(
            body?.expectedRole ?? 'STUDENT', request.ip,
            request.headers['user-agent'],
        );
    }

    @Post('forgot-password')
    @Public()
    forgotPassword(
        @Body() body: { email: string; expectedRole: UserRole },
    ) {
        return this.authService.forgotPassword(body.email, body.expectedRole);
    }

    @Post('reset-password')
    @Public()
    resetPassword(
        @Body()
        body: {
            email: string;
            pin: string;
            newPassword: string;
            expectedRole: UserRole;
        },
    ) {
        return this.authService.resetPassword(
            body.email,
            body.pin,
            body.newPassword,
            body.expectedRole,
        );
    }

    @Post('refresh')
    @Public()
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
    @Public()
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

    @Post('change-password')
    changePassword(@Req() req: AuthenticatedRequest, @Body() body: { oldPassword: string; newPassword: string; confirmPassword: string }) {
        return this.authService.changePassword(req.user.userId, body.oldPassword, body.newPassword, body.confirmPassword);
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
