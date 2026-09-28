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

    @Column({ name: 'attempt_id' })
    attemptId: number;

    @Column({ name: 'question_id' })
    questionId: number;

    @Column({
        name: 'answer_id',
        nullable: true,
    })
    answerId: number;
}