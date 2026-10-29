import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({
    schema: 'lms',
    name: 'lessons',
})
export class Lesson {
    @PrimaryGeneratedColumn({
        name: 'lesson_id',
        type: 'bigint',
    })
    lessonId: number;

    @Column({
        name: 'course_id',
        type: 'bigint',
    })
    courseId: number;

    @Column({
        name: 'title',
        type: 'varchar',
        length: 220,
    })
    title: string;

    @Column({
        name: 'content',
        type: 'text',
        nullable: true,
    })
    content: string | null;

    @Column({
        name: 'lesson_order',
        type: 'integer',
    })
    lessonOrder: number;

    @Column({
        name: 'estimated_duration_seconds',
        type: 'integer',
        nullable: true,
    })
    estimatedDurationSeconds: number | null;

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