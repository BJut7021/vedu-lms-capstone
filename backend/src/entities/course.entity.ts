import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('courses')
export class Course {
    @PrimaryGeneratedColumn({ name: 'course_id' })
    courseId: number;

    @Column({ name: 'course_name', length: 150 })
    courseName: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ name: 'teacher_id', type: 'integer' })
    teacherId: number;

    @Column({
        type: 'numeric',
        precision: 12,
        scale: 2,
        default: 0,
    })
    price: number;

    @Column({
        length: 20,
        default: 'DRAFT',
    })
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}