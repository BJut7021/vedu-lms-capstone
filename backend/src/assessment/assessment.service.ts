import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz } from '../entities/quiz.entity';
import { Question } from '../entities/question.entity';
import { Answer } from '../entities/answer.entity';

import { QuizAttempt } from '../entities/quiz-attempt.entity';
import { QuizAttemptAnswer } from '../entities/quiz-attempt-answer.entity';

@Injectable()
export class AssessmentService {
    constructor(
        @InjectRepository(Quiz)
        private readonly quizRepository: Repository<Quiz>,

        @InjectRepository(Answer)
        private readonly answerRepository: Repository<Answer>,

        @InjectRepository(Question)
        private readonly questionRepository: Repository<Question>,

        @InjectRepository(QuizAttempt)
        private readonly quizAttemptRepository: Repository<QuizAttempt>,

        @InjectRepository(QuizAttemptAnswer)
        private readonly quizAttemptAnswerRepository: Repository<QuizAttemptAnswer>,
    ) { } 

    async findAll(): Promise<Quiz[]> {
        return this.quizRepository.find({
            order: {
                quizId: 'ASC',
            },
        });
    }

    async findOne(id: number): Promise<Quiz> {
        const quiz = await this.quizRepository.findOne({
            where: {
                quizId: id,
            },
        });

        if (!quiz) {
            throw new NotFoundException(`Quiz ${id} không tồn tại`);
        }

        return quiz;
    }

    async findByCourse(courseId: number): Promise<Quiz[]> {
        return this.quizRepository.find({
            where: {
                courseId,
            },
            order: {
                quizId: 'ASC',
            },
        });
    }

    async create(data: Partial<Quiz>): Promise<Quiz> {
        const quiz = this.quizRepository.create(data);
        return this.quizRepository.save(quiz);
    }

    async update(id: number, data: Partial<Quiz>): Promise<Quiz> {
        const quiz = await this.findOne(id);

        Object.assign(quiz, data);

        return this.quizRepository.save(quiz);
    }

    async remove(id: number): Promise<void> {
        const quiz = await this.findOne(id);

        await this.quizRepository.remove(quiz);
    }

    async findQuestionsByQuiz(quizId: number): Promise<Question[]> {
        return this.questionRepository.find({
            where: {
                quizId,
            },
            order: {
                questionOrder: 'ASC',
            },
        });
    }

    async createQuestion(data: Partial<Question>): Promise<Question> {
        const question = this.questionRepository.create(data);

        return this.questionRepository.save(question);
    }

    async findQuestion(id: number): Promise<Question> {
        const question = await this.questionRepository.findOne({
            where: {
                questionId: id,
            },
        });

        if (!question) {
            throw new NotFoundException(`Question ${id} không tồn tại`);
        }

        return question;
    }

    async findAnswersByQuestion(questionId: number): Promise<Answer[]> {
        return this.answerRepository.find({
            where: {
                questionId,
            },
            order: {
                answerOrder: 'ASC',
            },
        });
    }

    async createAnswer(data: Partial<Answer>): Promise<Answer> {
        const answer = this.answerRepository.create(data);

        return this.answerRepository.save(answer);
    }

    async findAnswer(id: number): Promise<Answer> {
        const answer = await this.answerRepository.findOne({
            where: {
                answerId: id,
            },
        });

        if (!answer) {
            throw new NotFoundException(`Answer ${id} không tồn tại`);
        }

        return answer;
    }

    async findAttempt(id: number): Promise<QuizAttempt> {
        const attempt = await this.quizAttemptRepository.findOne({
            where: {
                attemptId: id,
            },
        });

        if (!attempt) {
            throw new NotFoundException(
                `Attempt ${id} không tồn tại`,
            );
        }

        return attempt;
    }

    async createAttempt(
        quizId: number,
        studentId: number,
        courseId: number,
        attemptNo: number,
    ): Promise<QuizAttempt> {
        const quiz = await this.quizRepository.findOne({
            where: { quizId },
        });

        if (!quiz) {
            throw new NotFoundException(`Quiz ${quizId} không tồn tại`);
        }

        const attempt = this.quizAttemptRepository.create({
            quizId,
            courseId,
            studentId,
            attemptNo,
            score: null,
            durationSeconds: null,
            startedAt: new Date(),
            submittedAt: null,
            status: 'IN_PROGRESS',
        });

        return this.quizAttemptRepository.save(attempt);
    }

    async submitAttempt(
        attemptId: number,
        answers: {
            questionId: number;
            answerId: number;
        }[],
    ): Promise<QuizAttempt> {
        const attempt = await this.quizAttemptRepository.findOne({
            where: {
                attemptId,
            },
        });

        if (!attempt) {
            throw new NotFoundException(
                `Attempt ${attemptId} không tồn tại`,
            );
        }

        if (attempt.status !== 'IN_PROGRESS') {
            throw new BadRequestException(
                'Bài làm này đã được nộp trước đó',
            );
        }

        const questions = await this.questionRepository.find({
            where: {
                quizId: attempt.quizId,
            },
            order: {
                questionOrder: 'ASC',
            },
        });

        if (questions.length === 0) {
            throw new BadRequestException(
                'Quiz chưa có câu hỏi',
            );
        }

        let totalPoints = 0;
        let earnedPoints = 0;

        for (const question of questions) {
            totalPoints += Number(question.points);
        }

        const answeredAt = new Date();

        for (const item of answers) {
            const question = questions.find(
                (q) => q.questionId === item.questionId,
            );

            if (!question) {
                throw new BadRequestException(
                    `Question ${item.questionId} không thuộc Quiz ${attempt.quizId}`,
                );
            }

            const answer = await this.answerRepository.findOne({
                where: {
                    answerId: item.answerId,
                    questionId: item.questionId,
                },
            });

            if (!answer) {
                throw new BadRequestException(
                    `Answer ${item.answerId} không thuộc Question ${item.questionId}`,
                );
            }

            const isCorrect = answer.isCorrect;
            const scoreAwarded = isCorrect
                ? Number(question.points)
                : 0;

            if (isCorrect) {
                earnedPoints += Number(question.points);
            }

            await this.quizAttemptAnswerRepository.save(
                this.quizAttemptAnswerRepository.create({
                    attemptId,
                    quizId: attempt.quizId,
                    questionId: item.questionId,
                    answerId: item.answerId,
                    isCorrect,
                    scoreAwarded,
                    answeredAt,
                }),
            );
        }

        const score =
            totalPoints > 0
                ? Number(((earnedPoints / totalPoints) * 10).toFixed(2))
                : 0;

        const submittedAt = new Date();

        const durationSeconds = Math.max(
            0,
            Math.floor(
                (submittedAt.getTime() - attempt.startedAt.getTime()) / 1000,
            ),
        );

        attempt.score = score;
        attempt.durationSeconds = durationSeconds;
        attempt.submittedAt = submittedAt;
        attempt.status = 'SUBMITTED';

        return this.quizAttemptRepository.save(attempt);
    }
}