import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({
    schema: 'lms',
    name: 'lessons',
})
export class Lesson {
    @PrimaryGeneratedColumn({ name: 'lesson_id' })
    lessonId: number;

    @Column({ name: 'course_id' })
    courseId: number;

    @Column({ length: 255 })
    title: string;

    @Column({ type: 'text', nullable: true })
    content: string;

    @Column({ name: 'video_url', type: 'text', nullable: true })
    videoUrl: string;

    @Column({ name: 'pdf_url', type: 'text', nullable: true })
    pdfUrl: string;

    @Column({ name: 'lesson_order' })
    lessonOrder: number;

    @Column({ name: 'is_published', default: false })
    isPublished: boolean;

    @Column({ name: 'is_deleted', default: false })
    isDeleted: boolean;

    @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
    deletedAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}