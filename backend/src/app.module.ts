import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';

import { LessonsModule } from './lessons/lessons.module';

import { EnrollmentModule } from './enrollment/enrollment.module';

import { PaymentModule } from './payment/payment.module';
import { AssessmentModule } from './assessment/assessment.module';

import { AuthModule } from './auth/auth.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),

        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],

            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get<string>('DB_HOST'),
                port: Number(configService.get<string>('DB_PORT')),
                username: configService.get<string>('DB_USERNAME'),
                password: configService.get<string>('DB_PASSWORD'),
                database: configService.get<string>('DB_DATABASE'),

                autoLoadEntities: true,
                synchronize: false,
            }),
        }),

        UsersModule,
        CoursesModule,
        LessonsModule,
        EnrollmentModule,
        PaymentModule,
        AssessmentModule,
        AuthModule,
    ],

    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }