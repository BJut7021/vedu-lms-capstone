import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Lesson } from '../entities/lesson.entity';

@Injectable()
export class LessonsService {
    constructor(
        @InjectRepository(Lesson)
        private readonly lessonsRepository: Repository<Lesson>,
    ) { }

    async findAll() {
        return this.lessonsRepository.find({
            where: { isDeleted: false },
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
}