import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Payment } from '../entities/payment.entity';

@Injectable()
export class PaymentService {
    constructor(
        @InjectRepository(Payment)
        private readonly paymentRepository:
            Repository<Payment>,
    ) { }

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
        return this.paymentRepository.find({
            where: {
                enrollmentId,
            },
            order: {
                createdAt: 'DESC',
            },
        });
    }

    async create(data: {
        enrollmentId: number;
        amount: number;
        paymentMethod: string;
        transactionCode?: string;
        status?: string;
    }) {
        const existing =
            await this.paymentRepository.findOne({
                where: {
                    transactionCode:
                        data.transactionCode,
                },
            });

        if (
            data.transactionCode &&
            existing
        ) {
            throw new ConflictException(
                'Transaction code already exists',
            );
        }

        const payment =
            this.paymentRepository.create({
                enrollmentId: data.enrollmentId,
                amount: data.amount,
                paymentMethod:
                    data.paymentMethod,
                transactionCode:
                    data.transactionCode,
                status:
                    data.status ?? 'PENDING',
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
        },
    ) {
        const payment =
            await this.findOne(paymentId);

        if (data.status !== undefined) {
            payment.status = data.status;

            if (data.status === 'PAID') {
                payment.paidAt = new Date();
            }
        }

        if (
            data.transactionCode !== undefined
        ) {
            payment.transactionCode =
                data.transactionCode;
        }

        return this.paymentRepository.save(
            payment,
        );
    }
}