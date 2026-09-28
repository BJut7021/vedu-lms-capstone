import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
} from '@nestjs/common';

import { EnrollmentService } from './enrollment.service';

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