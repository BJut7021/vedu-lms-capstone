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

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../entities/user.entity';
import { PortalService } from './portal.service';

type AuthenticatedRequest = Request & {
    user: {
        userId: number;
        email: string;
        role: UserRole;
    };
};

@Controller('api/portal')
@UseGuards(JwtAuthGuard)
export class PortalController {
    constructor(private readonly portalService: PortalService) { }

    @Get('overview')
    overview(@Req() request: AuthenticatedRequest) {
        return this.portalService.overview(
            request.user.userId,
            request.user.role,
        );
    }

    @Post('student/recommendations/:id/feedback')
    @UseGuards(RolesGuard)
    @Roles('STUDENT')
    recommendationFeedback(
        @Req() request: AuthenticatedRequest,
        @Param('id', ParseIntPipe) recommendationId: number,
        @Body() body: {
            action: string;
            rating?: number;
            comment?: string;
        },
    ) {
        return this.portalService.recommendationFeedback(
            request.user.userId,
            recommendationId,
            body,
        );
    }

    @Post('student/tickets')
    @UseGuards(RolesGuard)
    @Roles('STUDENT')
    createTicket(
        @Req() request: AuthenticatedRequest,
        @Body() body: {
            subject: string;
            category?: string;
            priority?: string;
            message?: string;
        },
    ) {
        return this.portalService.createTicket(request.user.userId, body);
    }

    @Post('teacher/courses')
    @UseGuards(RolesGuard)
    @Roles('TEACHER')
    createCourse(
        @Req() request: AuthenticatedRequest,
        @Body() body: {
            name: string;
            description?: string;
            price?: number;
        },
    ) {
        return this.portalService.createCourse(request.user.userId, body);
    }

    @Post('teacher/courses/:id/lessons')
    @UseGuards(RolesGuard)
    @Roles('TEACHER')
    createLesson(
        @Req() request: AuthenticatedRequest,
        @Param('id', ParseIntPipe) courseId: number,
        @Body() body: {
            title: string;
            content?: string;
            durationSeconds?: number;
        },
    ) {
        return this.portalService.createLesson(
            request.user.userId,
            courseId,
            body,
        );
    }

    @Patch('teacher/courses/:id/status')
    @UseGuards(RolesGuard)
    @Roles('TEACHER')
    updateCourseStatus(
        @Req() request: AuthenticatedRequest,
        @Param('id', ParseIntPipe) courseId: number,
        @Body() body: { status: string },
    ) {
        return this.portalService.updateCourseStatus(
            request.user.userId,
            courseId,
            body.status,
        );
    }

    @Post('admin/mining-runs/demo')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    runDemoMining(@Req() request: AuthenticatedRequest) {
        return this.portalService.runDemoMining(request.user.userId);
    }
}
