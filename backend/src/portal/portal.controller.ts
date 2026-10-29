import {
    Body,
    Controller,
    Get,
    Param,
    Delete,
    ParseIntPipe,
    Patch,
    Res,
    UploadedFile,
    UseInterceptors,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
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
            topic?: string;
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

        // Lấy danh sách tài liệu của bài học
    @Get('teacher/courses/:courseId/lessons/:lessonId/resources')
    @UseGuards(RolesGuard)
    @Roles('TEACHER')
    getTeacherLessonResources(
        @Req() request: AuthenticatedRequest,
        @Param('courseId', ParseIntPipe) courseId: number,
        @Param('lessonId', ParseIntPipe) lessonId: number,
    ) {
        return this.portalService.getTeacherLessonResources(
            request.user.userId,
            courseId,
            lessonId,
        );
    }

    // Thêm tài liệu vào bài học
    @Post('teacher/courses/:courseId/lessons/:lessonId/resources')
    @UseGuards(RolesGuard)
    @Roles('TEACHER')
    addTeacherLessonResource(
        @Req() request: AuthenticatedRequest,
        @Param('courseId', ParseIntPipe) courseId: number,
        @Param('lessonId', ParseIntPipe) lessonId: number,
        @Body() body: {
            resourceType: string;
            title: string;
            resourceUrl: string;
        },
    ) {
        return this.portalService.addTeacherLessonResource(
            request.user.userId,
            courseId,
            lessonId,
            body,
        );
    }

        // Sửa tài liệu của bài học
    @Patch('teacher/courses/:courseId/lessons/:lessonId/resources/:resourceId')
    @UseGuards(RolesGuard)
    @Roles('TEACHER')
    updateTeacherLessonResource(
        @Req() request: AuthenticatedRequest,
        @Param('courseId', ParseIntPipe) courseId: number,
        @Param('lessonId', ParseIntPipe) lessonId: number,
        @Param('resourceId', ParseIntPipe) resourceId: number,
        @Body() body: {
            resourceType: string;
            title: string;
            resourceUrl: string;
        },
    ) {
        return this.portalService.updateTeacherLessonResource(
            request.user.userId,
            courseId,
            lessonId,
            resourceId,
            body,
        );
    }

    // Xóa tài liệu của bài học
    @Delete('teacher/courses/:courseId/lessons/:lessonId/resources/:resourceId')
    @UseGuards(RolesGuard)
    @Roles('TEACHER')
    deleteTeacherLessonResource(
        @Req() request: AuthenticatedRequest,
        @Param('courseId', ParseIntPipe) courseId: number,
        @Param('lessonId', ParseIntPipe) lessonId: number,
        @Param('resourceId', ParseIntPipe) resourceId: number,
    ) {
        return this.portalService.deleteTeacherLessonResource(
            request.user.userId,
            courseId,
            lessonId,
            resourceId,
        );
    }

        

        @Patch('teacher/courses/:courseId/lessons/:lessonId/resources/:resourceId/replace-pdf')
    @UseGuards(RolesGuard)
    @Roles('TEACHER')
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { fileSize: 20 * 1024 * 1024, files: 1 },
        }),
    )
    replaceTeacherPdf(
        @Req() request: AuthenticatedRequest,
        @Param('courseId', ParseIntPipe) courseId: number,
        @Param('lessonId', ParseIntPipe) lessonId: number,
        @Param('resourceId', ParseIntPipe) resourceId: number,
        @Body() body: { title?: string },
        @UploadedFile() file?: { buffer: Buffer },
    ) {
        return this.portalService.replaceTeacherPdf(
            request.user.userId,
            courseId,
            lessonId,
            resourceId,
            body.title,
            file,
        );
    }

    @Get('teacher/courses/:courseId/lessons/:lessonId/resources/:resourceId/file')
@UseGuards(RolesGuard)
@Roles('TEACHER')

    async viewTeacherPdf(
        @Req() request: AuthenticatedRequest,
        @Param('courseId', ParseIntPipe) courseId: number,
        @Param('lessonId', ParseIntPipe) lessonId: number,
        @Param('resourceId', ParseIntPipe) resourceId: number,
        @Res() res: Response,
    ) {
        const file = await this.portalService.getTeacherPdfFile(
    request.user.userId,
    courseId,
    lessonId,
    resourceId,
);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Cache-Control', 'private, no-store');

        return res.sendFile(file.path);
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

}
