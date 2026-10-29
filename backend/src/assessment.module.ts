import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';

import { Quiz } from '../entities/quiz.entity';
import { Question } from '../entities/question.entity';
import { Answer } from '../entities/answer.entity';
import { QuizAttempt } from '../entities/quiz-attempt.entity';
import { QuizAttemptAnswer } from '../entities/quiz-attempt-answer.entity';
import { User } from '../entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Quiz,
            Question,
            Answer,
            QuizAttempt,
            QuizAttemptAnswer,
            User,
        ]),
    ],
    controllers: [AssessmentController],
    providers: [AssessmentService],
})
export class AssessmentModule { }
