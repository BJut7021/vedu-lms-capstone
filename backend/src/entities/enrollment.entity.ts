import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

@Entity({
    schema: 'enrollment',
    name: 'enrollments',
})
export class Enrollment {
    @PrimaryGeneratedColumn({ name: 'enrollment_id' })
    enrollmentId: number;

    @Column({ name: 'student_id' })
    studentId: number;

    @Column({ name: 'course_id' })
    courseId: number;

    @CreateDateColumn({ name: 'enrolled_at' })
    enrolledAt: Date;

    @Column({ length: 30 })
    status: string;
}