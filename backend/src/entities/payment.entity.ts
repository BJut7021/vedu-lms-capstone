import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({
    schema: 'payment',
    name: 'payments',
})
export class Payment {
    @PrimaryGeneratedColumn({
        name: 'payment_id',
        type: 'bigint',
    })
    paymentId: number;

    @Column({
        name: 'order_id',
        type: 'bigint',
    })
    orderId: number;

    @Column({
        name: 'amount',
        type: 'numeric',
        precision: 12,
        scale: 2,
    })
    amount: number;

    @Column({
        name: 'currency',
        type: 'char',
        length: 3,
        default: 'VND',
    })
    currency: string;

    @Column({
        name: 'payment_method',
        type: 'varchar',
        length: 30,
    })
    paymentMethod: string;

    @Column({
        name: 'provider',
        type: 'varchar',
        length: 50,
        nullable: true,
    })
    provider: string | null;

    @Column({
        name: 'transaction_code',
        type: 'varchar',
        length: 150,
        nullable: true,
    })
    transactionCode: string | null;

    @Column({
        name: 'idempotency_key',
        type: 'uuid',
        default: () => 'gen_random_uuid()',
    })
    idempotencyKey: string;

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
        name: 'failed_at',
        type: 'timestamptz',
        nullable: true,
    })
    failedAt: Date | null;

    @Column({
        name: 'refunded_at',
        type: 'timestamptz',
        nullable: true,
    })
    refundedAt: Date | null;

    @Column({
        name: 'provider_payload',
        type: 'jsonb',
        nullable: true,
    })
    providerPayload: Record<string, unknown> | null;

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