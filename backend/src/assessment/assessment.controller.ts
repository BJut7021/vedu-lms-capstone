import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    ParseIntPipe,
} from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { Quiz } from '../entities/quiz.entity';
import { Question } from '../entities/question.entity';
import { Answer } from '../entities/answer.entity';
import { QuizAttempt } from '../entities/quiz-attempt.entity';

@Controller('api/quizzes')
export class AssessmentController {
    constructor(
        private readonly assessmentService: AssessmentService,
    ) { }

    @Get()
    findAll(): Promise<Quiz[]> {
        return this.assessmentService.findAll();
    }

    @Get('course/:courseId')
    findByCourse(
        @Param('courseId', ParseIntPipe) courseId: number,
    ): Promise<Quiz[]> {
        return this.assessmentService.findByCourse(courseId);
    }

    @Get('quiz/:quizId/questions')
    findQuestionsByQuiz(
        @Param('quizId', ParseIntPipe) quizId: number,
    ): Promise<Question[]> {
        return this.assessmentService.findQuestionsByQuiz(quizId);
    }

    @Get('questions/:id')
    findQuestion(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<Question> {
        return this.assessmentService.findQuestion(id);
    }

    @Get(':id')
    findOne(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<Quiz> {
        return this.assessmentService.findOne(id);
    }

    @Get('questions/:questionId/answers')
    findAnswersByQuestion(
        @Param('questionId', ParseIntPipe) questionId: number,
    ): Promise<Answer[]> {
        return this.assessmentService.findAnswersByQuestion(questionId);
    }

    @Post('answers')
    createAnswer(
        @Body() data: Partial<Answer>,
    ): Promise<Answer> {
        return this.assessmentService.createAnswer(data);
    }

    @Get('answers/:id')
    findAnswer(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<Answer> {
        return this.assessmentService.findAnswer(id);
    }

    @Post()
    create(@Body() data: Partial<Quiz>): Promise<Quiz> {
        return this.assessmentService.create(data);
    }

    @Post(':quizId/attempts')
    createAttempt(
        @Param('quizId', ParseIntPipe) quizId: number,
        @Body() body: {
            studentId: number;
            courseId: number;
            attemptNo: number;
        }
    ): Promise<QuizAttempt> {
        return this.assessmentService.createAttempt(
            Number(quizId),
            Number(body.studentId),
            Number(body.courseId),
            Number(body.attemptNo),
        );
    }

    @Get('attempts/:attemptId')
    findAttempt(
        @Param('attemptId', ParseIntPipe) attemptId: number,
    ): Promise<QuizAttempt> {
        return this.assessmentService.findAttempt(attemptId);
    }

    @Post('attempts/:attemptId/submit')
    submitAttempt(
        @Param('attemptId', ParseIntPipe) attemptId: number,
        @Body()
        body: {
            answers: {
                questionId: number;
                answerId: number;
            }[];
        },
    ): Promise<QuizAttempt> {
        return this.assessmentService.submitAttempt(
            attemptId,
            body.answers,
        );
    }

    @Post('questions')
    createQuestion(
        @Body() data: Partial<Question>,
    ): Promise<Question> {
        return this.assessmentService.createQuestion(data);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() data: Partial<Quiz>,
    ): Promise<Quiz> {
        return this.assessmentService.update(id, data);
    }

    @Delete(':id')
    async remove(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<{ message: string }> {
        await this.assessmentService.remove(id);

        return {
            message: `Đã xóa quiz ${id}`,
        };
    }
}