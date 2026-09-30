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

    @Get(':id/resources')
    findResources(
        @Param('id', ParseIntPipe)
        id: number,
    ) {
        return this.lessonsService.findResources(id);
    }

    @Post(':id/resources')
    createResource(
        @Param('id', ParseIntPipe)
        id: number,

        @Body()
        body: {
            resourceType: string;
            title?: string;
            resourceUrl: string;
            displayOrder?: number;
        },
    ) {
        return this.lessonsService.createResource(id, body);
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
            lessonOrder: number;
            estimatedDurationSeconds?: number;
            isPublished?: boolean;
        },
    ) {
        return this.lessonsService.create({
            courseId: body.courseId,
            title: body.title,
            content: body.content,
            lessonOrder: body.lessonOrder,
            estimatedDurationSeconds:
                body.estimatedDurationSeconds ?? null,
            isPublished:
                body.isPublished ?? true,
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
            lessonOrder: number;
            estimatedDurationSeconds: number;
            isPublished: boolean;
        }>,
    ) {
        return this.lessonsService.update(id, body);
    }

    @Patch('resources/:resourceId')
    updateResource(
        @Param('resourceId', ParseIntPipe)
        resourceId: number,

        @Body()
        body: Partial<{
            resourceType: string;
            title: string;
            resourceUrl: string;
            displayOrder: number;
        }>,
    ) {
        return this.lessonsService.updateResource(
            resourceId,
            body,
        );
    }

    @Delete('resources/:resourceId')
    removeResource(
        @Param('resourceId', ParseIntPipe)
        resourceId: number,
    ) {
        return this.lessonsService.removeResource(resourceId);
    }

    @Delete(':id')
    remove(
        @Param('id', ParseIntPipe)
        id: number,
    ) {
        return this.lessonsService.remove(id);
    }
}