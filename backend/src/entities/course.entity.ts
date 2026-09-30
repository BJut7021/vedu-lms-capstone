import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({
    schema: 'lms',
    name: 'courses',
})
export class Course {
    @PrimaryGeneratedColumn({
        name: 'course_id',
        type: 'bigint',
    })
    courseId: number;

    @Column({
        name: 'course_name',
        type: 'varchar',
        length: 220,
    })
    courseName: string;

    @Column({
        name: 'description',
        type: 'text',
        nullable: true,
    })
    description: string | null;

    @Column({
        name: 'teacher_id',
        type: 'bigint',
    })
    teacherId: number;

    @Column({
        name: 'price',
        type: 'numeric',
        precision: 12,
        scale: 2,
        default: 0,
    })
    price: number;

    @Column({
        name: 'currency',
        type: 'char',
        length: 3,
        default: 'VND',
    })
    currency: string;

    @Column({
        name: 'status',
        type: 'varchar',
        length: 20,
        default: 'DRAFT',
    })
    status: string;

    @Column({
        name: 'thumbnail_url',
        type: 'text',
        nullable: true,
    })
    thumbnailUrl: string | null;

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