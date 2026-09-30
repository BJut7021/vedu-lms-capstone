import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Payment } from '../entities/payment.entity';
import { Order } from '../entities/order.entity';

@Injectable()
export class PaymentService {
    constructor(
        @InjectRepository(Payment)
        private readonly paymentRepository: Repository<Payment>,

        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
    ) { }

    // ============================================================
    // ORDERS
    // ============================================================

    async findAllOrders() {
        return this.orderRepository.find({
            order: {
                orderId: 'ASC',
            },
        });
    }

    async findOrder(orderId: number) {
        const order = await this.orderRepository.findOne({
            where: {
                orderId,
            },
        });

        if (!order) {
            throw new NotFoundException(
                'Order not found',
            );
        }

        return order;
    }

    async createOrder(enrollmentId: number) {
        // Dùng function của DB v6 để tạo order
        // từ snapshot của enrollment.
        const result = await this.orderRepository.query(
            `
            SELECT payment.fn_create_order($1) AS order_id
            `,
            [enrollmentId],
        );

        const orderId = Number(result[0]?.order_id);

        if (!orderId) {
            throw new NotFoundException(
                'Cannot create order for enrollment',
            );
        }

        return this.findOrder(orderId);
    }

    // ============================================================
    // PAYMENTS
    // ============================================================

    async findAll() {
        return this.paymentRepository.find({
            order: {
                paymentId: 'ASC',
            },
        });
    }

    async findOne(paymentId: number) {
        const payment =
            await this.paymentRepository.findOne({
                where: {
                    paymentId,
                },
            });

        if (!payment) {
            throw new NotFoundException(
                'Payment not found',
            );
        }

        return payment;
    }

    async findByEnrollment(enrollmentId: number) {
        const order =
            await this.orderRepository.findOne({
                where: {
                    enrollmentId,
                },
            });

        if (!order) {
            return [];
        }

        return this.paymentRepository.find({
            where: {
                orderId: order.orderId,
            },
            order: {
                createdAt: 'DESC',
            },
        });
    }

    async create(data: {
        orderId: number;
        amount: number;
        currency?: string;
        paymentMethod: string;
        provider?: string;
        transactionCode?: string;
        idempotencyKey?: string;
        status?: string;
        providerPayload?: Record<string, unknown>;
    }) {
        // Kiểm tra order tồn tại
        const order =
            await this.findOrder(data.orderId);

        // transaction_code unique nếu có
        if (data.transactionCode) {
            const existing =
                await this.paymentRepository.findOne({
                    where: {
                        transactionCode:
                            data.transactionCode,
                    },
                });

            if (existing) {
                throw new ConflictException(
                    'Transaction code already exists',
                );
            }
        }

        const payment =
            this.paymentRepository.create({
                orderId: order.orderId,
                amount: data.amount,
                currency:
                    data.currency ??
                    order.currency,
                paymentMethod:
                    data.paymentMethod,
                provider:
                    data.provider ?? null,
                transactionCode:
                    data.transactionCode ?? null,
                idempotencyKey:
                    data.idempotencyKey
                        ? data.idempotencyKey
                        : undefined,
                status:
                    data.status ?? 'PENDING',
                providerPayload:
                    data.providerPayload ??
                    null,
            });

        return this.paymentRepository.save(
            payment,
        );
    }

    async update(
        paymentId: number,
        data: {
            status?: string;
            transactionCode?: string;
            provider?: string;
            providerPayload?: Record<string, unknown>;
        },
    ) {
        const payment =
            await this.findOne(paymentId);

        if (
            data.transactionCode !== undefined &&
            data.transactionCode !==
            payment.transactionCode
        ) {
            const existing =
                await this.paymentRepository.findOne({
                    where: {
                        transactionCode:
                            data.transactionCode,
                    },
                });

            if (existing) {
                throw new ConflictException(
                    'Transaction code already exists',
                );
            }

            payment.transactionCode =
                data.transactionCode;
        }

        if (data.provider !== undefined) {
            payment.provider =
                data.provider;
        }

        if (
            data.providerPayload !== undefined
        ) {
            payment.providerPayload =
                data.providerPayload;
        }

        if (data.status !== undefined) {
            payment.status = data.status;

            if (data.status === 'PAID') {
                payment.paidAt = new Date();
            }

            if (data.status === 'FAILED') {
                payment.failedAt =
                    new Date();
            }

            if (
                data.status === 'REFUNDED'
            ) {
                payment.refundedAt =
                    new Date();
            }
        }

        return this.paymentRepository.save(
            payment,
        );
    }
}