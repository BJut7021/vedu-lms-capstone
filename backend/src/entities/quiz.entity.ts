import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({
    schema: 'assessment',
    name: 'quizzes',
})
export class Quiz {
    @PrimaryGeneratedColumn({
        name: 'quiz_id',
        type: 'bigint',
    })
    quizId: number;

    @Column({
        name: 'course_id',
        type: 'bigint',
    })
    courseId: number;

    @Column({
        name: 'lesson_id',
        type: 'bigint',
        nullable: true,
    })
    lessonId: number | null;

    @Column({
        name: 'title',
        type: 'varchar',
        length: 220,
    })
    title: string;

    @Column({
        name: 'description',
        type: 'text',
        nullable: true,
    })
    description: string | null;

    @Column({
        name: 'time_limit_seconds',
        type: 'integer',
        nullable: true,
    })
    timeLimitSeconds: number | null;

    @Column({
        name: 'passing_score',
        type: 'numeric',
        precision: 5,
        scale: 2,
        default: 5,
    })
    passingScore: number;

    @Column({
        name: 'max_attempts',
        type: 'integer',
        default: 3,
    })
    maxAttempts: number;

    @Column({
        name: 'is_published',
        type: 'boolean',
        default: true,
    })
    isPublished: boolean;

    @Column({
        name: 'is_deleted',
        type: 'boolean',
        default: false,
    })
    isDeleted: boolean;

    @Column({
        name: 'deleted_at',
        type: 'timestamptz',
        nullable: true,
    })
    deletedAt: Date | null;

    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamptz',
    })
    createdAt: Date;

    @UpdateDateColumn({
        name: 'updated_at',
        type: 'timestamptz',
    })
    updatedAt: Date;
}