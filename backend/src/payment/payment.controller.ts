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

@Controller('api/payments')
export class PaymentController {
    constructor(
        private readonly paymentService:
            PaymentService,
    ) { }

    @Get()
    findAll() {
        return this.paymentService.findAll();
    }

    @Get('enrollment/:enrollmentId')
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

    @Get(':id')
    findOne(
        @Param('id', ParseIntPipe)
        id: number,
    ) {
        return this.paymentService.findOne(id);
    }

    @Post()
    create(
        @Body()
        body: {
            enrollmentId: number;
            amount: number;
            paymentMethod: string;
            transactionCode?: string;
            status?: string;
        },
    ) {
        return this.paymentService.create({
            enrollmentId:
                body.enrollmentId,

            amount: body.amount,

            paymentMethod:
                body.paymentMethod,

            transactionCode:
                body.transactionCode,

            status: body.status,
        });
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe)
        id: number,

        @Body()
        body: {
            status?: string;
            transactionCode?: string;
        },
    ) {
        return this.paymentService.update(
            id,
            body,
        );
    }
}