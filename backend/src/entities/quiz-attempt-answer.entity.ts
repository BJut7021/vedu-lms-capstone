import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from 'typeorm';

@Entity({
    schema: 'assessment',
    name: 'quiz_attempt_answers',
})
export class QuizAttemptAnswer {
    @PrimaryGeneratedColumn({ name: 'attempt_answer_id' })
    attemptAnswerId: number;

    @Column({ name: 'attempt_id', type: 'bigint' })
    attemptId: number;

    @Column({ name: 'quiz_id', type: 'bigint' })
    quizId: number;

    @Column({ name: 'question_id', type: 'bigint' })
    questionId: number;

    @Column({
        name: 'answer_id',
        type: 'bigint',
        nullable: true,
    })
    answerId: number | null;

    @Column({
        name: 'is_correct',
        type: 'boolean',
        nullable: true,
    })
    isCorrect: boolean | null;

    @Column({
        name: 'score_awarded',
        type: 'numeric',
        precision: 6,
        scale: 2,
        default: 0,
    })
    scoreAwarded: number;

    @Column({
        name: 'answered_at',
        type: 'timestamptz',
    })
    answeredAt: Date;
}