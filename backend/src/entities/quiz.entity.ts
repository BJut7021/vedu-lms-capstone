import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({
    schema: 'assessment',
    name: 'quizzes',
})
export class Quiz {
    @PrimaryGeneratedColumn({ name: 'quiz_id' })
    quizId: number;

    @Column({ name: 'course_id' })
    courseId: number;

    @Column({ name: 'lesson_id', nullable: true })
    lessonId: number;

    @Column({ length: 255 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ name: 'time_limit', nullable: true })
    timeLimit: number;

    @Column({
        name: 'passing_score',
        type: 'numeric',
        nullable: true,
    })
    passingScore: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}