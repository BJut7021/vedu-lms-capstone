import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Lesson } from '../entities/lesson.entity';
import { LessonResource } from '../entities/lesson-resource.entity';

import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Lesson,
            LessonResource,
        ]),
    ],
    controllers: [LessonsController],
    providers: [LessonsService],
})
export class LessonsModule { }