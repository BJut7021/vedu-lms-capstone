import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { EnrollmentService } from './enrollment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { UserRole } from '../entities/user.entity';

type AuthenticatedRequest = Request & {
    user: {
        userId: number;
        email: string;
        role: UserRole;
    };
};

@Controller('api/enrollments')
export class EnrollmentController {
    constructor(
        private readonly enrollmentService:
            EnrollmentService,
    ) { }

    @Get()
    findAll() {
        return this.enrollmentService.findAll();
    }

    @Get('student/:studentId')
    findByStudent(
        @Param('studentId', ParseIntPipe)
        studentId: number,
    ) {
        return this.enrollmentService.findByStudent(
            studentId,
        );
    }

    @Get('course/:courseId')
    findByCourse(
        @Param('courseId', ParseIntPipe)
        courseId: number,
    ) {
        return this.enrollmentService.findByCourse(
            courseId,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Post('me/:courseId')
    enrollMe(
        @Req() request: AuthenticatedRequest,
        @Param('courseId', ParseIntPipe) courseId: number,
    ) {
        return this.enrollmentService.enrollOrGet(
            request.user.userId,
            courseId,
        );
    }

    @Get(':id')
    findOne(
        @Param('id', ParseIntPipe)
        id: number,
    ) {
        return this.enrollmentService.findOne(id);
    }

    @Post()
    create(
        @Body()
        body: {
            studentId: number;
            courseId: number;
            status?: string;
        },
    ) {
        return this.enrollmentService.create({
            studentId: body.studentId,
            courseId: body.courseId,
            status: body.status,
        });
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe)
        id: number,

        @Body()
        body: {
            status?: string;
        },
    ) {
        return this.enrollmentService.update(
            id,
            body,
        );
    }

    @Delete(':id')
    remove(
        @Param('id', ParseIntPipe)
        id: number,
    ) {
        return this.enrollmentService.remove(id);
    }
}
