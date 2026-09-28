import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({
    schema: 'payment',
    name: 'payments',
})
export class Payment {
    @PrimaryGeneratedColumn({ name: 'payment_id' })
    paymentId: number;

    @Column({ name: 'enrollment_id' })
    enrollmentId: number;

    @Column({
        type: 'numeric',
        precision: 12,
        scale: 2,
    })
    amount: number;

    @Column({
        name: 'payment_method',
        length: 50,
    })
    paymentMethod: string;

    @Column({
        name: 'transaction_code',
        length: 100,
        nullable: true,
    })
    transactionCode: string;

    @Column({
        length: 30,
    })
    status: string;

    @Column({
        name: 'paid_at',
        type: 'timestamp',
        nullable: true,
    })
    paidAt: Date;

    @CreateDateColumn({
        name: 'created_at',
    })
    createdAt: Date;

    @UpdateDateColumn({
        name: 'updated_at',
    })
    updatedAt: Date;
}