import {
    Injectable,
    NotFoundException,
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

    async getPlayableQuiz(id: number) {
        const quiz = await this.quizRepository.findOne({
            where: {
                quizId: id,
                isPublished: true,
                isDeleted: false,
            },
        });

        if (!quiz) {
            throw new NotFoundException(`Quiz ${id} không tồn tại`);
        }

        const questions = await this.questionRepository.find({
            where: { quizId: id },
            order: { questionOrder: 'ASC' },
        });

        const playableQuestions = await Promise.all(
            questions.map(async (question) => {
                const answers = await this.answerRepository.find({
                    where: { questionId: question.questionId },
                    order: { answerOrder: 'ASC' },
                });

                return {
                    id: Number(question.questionId),
                    question: question.questionText,
                    points: Number(question.points),
                    options: answers.map((answer) => ({
                        id: Number(answer.answerId),
                        text: answer.answerText,
                    })),
                };
            }),
        );

        return {
            id: Number(quiz.quizId),
            courseId: Number(quiz.courseId),
            title: quiz.title,
            description: quiz.description,
            durationSeconds: Math.max(1, Number(quiz.timeLimitSeconds ?? 600)),
            passingScore: Number(quiz.passingScore),
            questions: playableQuestions,
        };
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
    ): Promise<QuizAttempt> {
        const quiz = await this.quizRepository.findOne({
            where: { quizId },
        });

        if (!quiz) {
            throw new NotFoundException(`Quiz ${quizId} không tồn tại`);
        }

        const existingAttempt = await this.quizAttemptRepository.findOne({
            where: {
                quizId,
                studentId,
                status: 'IN_PROGRESS',
            },
        });

        if (existingAttempt) {
            return existingAttempt;
        }

        const previousAttempts = await this.quizAttemptRepository.count({
            where: { quizId, studentId },
        });

        const attemptNo = previousAttempts + 1;
        if (attemptNo > Number(quiz.maxAttempts)) {
            throw new BadRequestException(
                `Bạn đã sử dụng hết ${quiz.maxAttempts} lượt làm bài`,
            );
        }

        const attempt = this.quizAttemptRepository.create({
            quizId,
            courseId: quiz.courseId,
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
        studentId: number,
        answers: {
            questionId: number;
            answerId: number;
        }[],
    ) {
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

        if (Number(attempt.studentId) !== Number(studentId)) {
            throw new BadRequestException(
                'Bạn không có quyền nộp bài làm này',
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


        if (!Array.isArray(answers) || answers.length !== questions.length) {
            throw new BadRequestException(
                'Vui lòng trả lời đầy đủ tất cả câu hỏi',
            );
        }

        if (new Set(answers.map((item) => item.questionId)).size !== answers.length) {
            throw new BadRequestException('Mỗi câu hỏi chỉ được gửi một đáp án');
        }

        let totalPoints = 0;
        let earnedPoints = 0;
        let correctCount = 0;

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
                correctCount += 1;
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

        const savedAttempt = await this.quizAttemptRepository.save(attempt);
        const quiz = await this.findOne(Number(attempt.quizId));

        return {
            attemptId: Number(savedAttempt.attemptId),
            quizId: Number(savedAttempt.quizId),
            courseId: Number(savedAttempt.courseId),
            studentId: Number(savedAttempt.studentId),
            attemptNo: savedAttempt.attemptNo,
            score: Number(savedAttempt.score),
            durationSeconds: savedAttempt.durationSeconds,
            startedAt: savedAttempt.startedAt,
            submittedAt: savedAttempt.submittedAt,
            status: savedAttempt.status,
            correctCount,
            totalQuestions: questions.length,
            passed: score >= Number(quiz.passingScore),
        };
    }
}
