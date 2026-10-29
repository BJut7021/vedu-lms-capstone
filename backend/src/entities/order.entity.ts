import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({
    schema: 'payment',
    name: 'orders',
})
export class Order {
    @PrimaryGeneratedColumn({
        name: 'order_id',
        type: 'bigint',
    })
    orderId: number;

    @Column({
        name: 'enrollment_id',
        type: 'bigint',
        unique: true,
    })
    enrollmentId: number;

    @Column({
        name: 'student_id',
        type: 'bigint',
    })
    studentId: number;

    @Column({
        name: 'course_id',
        type: 'bigint',
    })
    courseId: number;

    @Column({
        name: 'listed_price',
        type: 'numeric',
        precision: 12,
        scale: 2,
    })
    listedPrice: number;

    @Column({
        name: 'discount_amount',
        type: 'numeric',
        precision: 12,
        scale: 2,
        default: 0,
    })
    discountAmount: number;

    @Column({
        name: 'final_amount',
        type: 'numeric',
        precision: 12,
        scale: 2,
    })
    finalAmount: number;

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
        default: 'PENDING',
    })
    status: string;

    @Column({
        name: 'paid_at',
        type: 'timestamptz',
        nullable: true,
    })
    paidAt: Date | null;

    @Column({
        name: 'cancelled_at',
        type: 'timestamptz',
        nullable: true,
    })
    cancelledAt: Date | null;

    @Column({
        name: 'refunded_at',
        type: 'timestamptz',
        nullable: true,
    })
    refundedAt: Date | null;

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