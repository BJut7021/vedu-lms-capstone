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

    @Column({ name: 'quiz_id', type: 'bigint' })
    quizId: number;

    @Column({ name: 'course_id', type: 'bigint' })
    courseId: number;

    @Column({ name: 'student_id', type: 'bigint' })
    studentId: number;

    @Column({ name: 'attempt_no', type: 'integer' })
    attemptNo: number;

    @Column({
        name: 'score',
        type: 'numeric',
        precision: 5,
        scale: 2,
        nullable: true,
    })
    score: number | null;

    @Column({
        name: 'duration_seconds',
        type: 'integer',
        nullable: true,
    })
    durationSeconds: number | null;

    @Column({
        name: 'started_at',
        type: 'timestamptz',
    })
    startedAt: Date;

    @Column({
        name: 'submitted_at',
        type: 'timestamptz',
        nullable: true,
    })
    submittedAt: Date | null;

    @Column({
        name: 'status',
        type: 'varchar',
        length: 20,
    })
    status: string;
}