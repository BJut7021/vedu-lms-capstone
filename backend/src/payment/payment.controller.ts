import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
} from '@nestjs/common';

import { PaymentService } from './payment.service';

@Controller('api')
export class PaymentController {
    constructor(
        private readonly paymentService: PaymentService,
    ) { }

    // ============================================================
    // ORDERS
    // ============================================================

    @Get('orders')
    findAllOrders() {
        return this.paymentService.findAllOrders();
    }

    @Get('orders/:id')
    findOrder(
        @Param('id', ParseIntPipe)
        id: number,
    ) {
        return this.paymentService.findOrder(id);
    }

    @Post('orders')
    createOrder(
        @Body()
        body: {
            enrollmentId: number;
        },
    ) {
        return this.paymentService.createOrder(
            body.enrollmentId,
        );
    }

    // ============================================================
    // PAYMENTS
    // ============================================================

    @Get('payments')
    findAll() {
        return this.paymentService.findAll();
    }

    @Get('payments/enrollment/:enrollmentId')
    findByEnrollment(
        @Param(
            'enrollmentId',
            ParseIntPipe,
        )
        enrollmentId: number,
    ) {
        return this.paymentService
            .findByEnrollment(enrollmentId);
    }

    @Get('payments/:id')
    findOne(
        @Param('id', ParseIntPipe)
        id: number,
    ) {
        return this.paymentService.findOne(id);
    }

    @Post('payments')
    create(
        @Body()
        body: {
            orderId: number;
            amount: number;
            currency?: string;
            paymentMethod: string;
            provider?: string;
            transactionCode?: string;
            idempotencyKey?: string;
            status?: string;
            providerPayload?: Record<string, unknown>;
        },
    ) {
        return this.paymentService.create({
            orderId: body.orderId,
            amount: body.amount,
            currency: body.currency,
            paymentMethod:
                body.paymentMethod,
            provider: body.provider,
            transactionCode:
                body.transactionCode,
            idempotencyKey:
                body.idempotencyKey,
            status: body.status,
            providerPayload:
                body.providerPayload,
        });
    }

    @Patch('payments/:id')
    update(
        @Param('id', ParseIntPipe)
        id: number,

        @Body()
        body: {
            status?: string;
            transactionCode?: string;
            provider?: string;
            providerPayload?: Record<string, unknown>;
        },
    ) {
        return this.paymentService.update(
            id,
            body,
        );
    }
}