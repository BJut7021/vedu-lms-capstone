import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Enrollment } from '../entities/enrollment.entity';
import { EnrollmentService } from './enrollment.service';
import { EnrollmentController } from './enrollment.controller';
import { User } from '../entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Enrollment, User]),
    ],
    controllers: [
        EnrollmentController,
    ],
    providers: [
        EnrollmentService,
    ],
})
export class EnrollmentModule { }
