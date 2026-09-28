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

import { LessonsService } from './lessons.service';

@Controller('api/lessons')
export class LessonsController {
    constructor(
        private readonly lessonsService: LessonsService,
    ) { }

    @Get()
    findAll() {
        return this.lessonsService.findAll();
    }

    @Get(':id')
    findOne(
        @Param('id', ParseIntPipe)
        id: number,
    ) {
        return this.lessonsService.findOne(id);
    }

    @Post()
    create(
        @Body()
        body: {
            courseId: number;
            title: string;
            content?: string;
            videoUrl?: string;
            pdfUrl?: string;
            lessonOrder: number;
            isPublished?: boolean;
        },
    ) {
        return this.lessonsService.create({
            courseId: body.courseId,
            title: body.title,
            content: body.content,
            videoUrl: body.videoUrl,
            pdfUrl: body.pdfUrl,
            lessonOrder: body.lessonOrder,
            isPublished: body.isPublished ?? false,
        });
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe)
        id: number,

        @Body()
        body: Partial<{
            courseId: number;
            title: string;
            content: string;
            videoUrl: string;
            pdfUrl: string;
            lessonOrder: number;
            isPublished: boolean;
        }>,
    ) {
        return this.lessonsService.update(id, body);
    }

    @Delete(':id')
    remove(
        @Param('id', ParseIntPipe)
        id: number,
    ) {
        return this.lessonsService.remove(id);
    }
}