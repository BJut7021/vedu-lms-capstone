import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from 'typeorm';

@Entity({
    schema: 'assessment',
    name: 'quiz_attempts',
})
export class QuizAttempt {
    @PrimaryGeneratedColumn({ name: 'attempt_id' })
    attemptId: number;

    @Column({ name: 'quiz_id' })
    quizId: number;

    @Column({ name: 'student_id' })
    studentId: number;

    @Column({
        type: 'numeric',
        nullable: true,
    })
    score: number | null;

    @Column({
        name: 'started_at',
        type: 'timestamp',
    })
    startedAt: Date;

    @Column({
        name: 'submitted_at',
        type: 'timestamp',
        nullable: true,
    })
    submittedAt: Date | null;

    @Column({
        length: 30,
    })
    status: string;
}