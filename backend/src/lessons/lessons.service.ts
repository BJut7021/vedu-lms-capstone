import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Lesson } from '../entities/lesson.entity';
import { LessonResource } from '../entities/lesson-resource.entity';

@Injectable()
export class LessonsService {
    constructor(
        @InjectRepository(Lesson)
        private readonly lessonsRepository: Repository<Lesson>,

        @InjectRepository(LessonResource)
        private readonly lessonResourcesRepository: Repository<LessonResource>,
    ) { }

    async findAll() {
        return this.lessonsRepository.find({
            where: {
                isDeleted: false,
            },
            order: {
                courseId: 'ASC',
                lessonOrder: 'ASC',
            },
        });
    }

    async findOne(lessonId: number) {
        const lesson = await this.lessonsRepository.findOne({
            where: {
                lessonId,
                isDeleted: false,
            },
        });

        if (!lesson) {
            throw new NotFoundException('Lesson not found');
        }

        return lesson;
    }

    async create(data: Partial<Lesson>) {
        const lesson = this.lessonsRepository.create(data);

        return this.lessonsRepository.save(lesson);
    }

    async update(
        lessonId: number,
        data: Partial<Lesson>,
    ) {
        const lesson = await this.findOne(lessonId);

        Object.assign(lesson, data);

        return this.lessonsRepository.save(lesson);
    }

    async remove(lessonId: number) {
        const lesson = await this.findOne(lessonId);

        lesson.isDeleted = true;
        lesson.deletedAt = new Date();

        await this.lessonsRepository.save(lesson);

        return {
            message: 'Lesson deleted successfully',
        };
    }

    // ============================================================
    // LESSON RESOURCES
    // ============================================================

    async findResources(lessonId: number) {
        await this.findOne(lessonId);

        return this.lessonResourcesRepository.find({
            where: {
                lessonId,
            },
            order: {
                displayOrder: 'ASC',
                resourceId: 'ASC',
            },
        });
    }

    async createResource(
        lessonId: number,
        data: {
            resourceType: string;
            title?: string;
            resourceUrl: string;
            displayOrder?: number;
        },
    ) {
        await this.findOne(lessonId);

        const resource = this.lessonResourcesRepository.create({
            lessonId,
            resourceType: data.resourceType,
            title: data.title ?? null,
            resourceUrl: data.resourceUrl,
            displayOrder: data.displayOrder ?? 1,
        });

        return this.lessonResourcesRepository.save(resource);
    }

    async findResource(resourceId: number) {
        const resource = await this.lessonResourcesRepository.findOne({
            where: {
                resourceId,
            },
        });

        if (!resource) {
            throw new NotFoundException('Lesson resource not found');
        }

        return resource;
    }

    async updateResource(
        resourceId: number,
        data: Partial<{
            resourceType: string;
            title: string;
            resourceUrl: string;
            displayOrder: number;
        }>,
    ) {
        const resource = await this.findResource(resourceId);

        Object.assign(resource, data);

        return this.lessonResourcesRepository.save(resource);
    }

    async removeResource(resourceId: number) {
        const resource = await this.findResource(resourceId);

        await this.lessonResourcesRepository.remove(resource);

        return {
            message: 'Lesson resource deleted successfully',
        };
    }
}