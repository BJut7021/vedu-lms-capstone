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
import { LearningModule } from './learning/learning.module';
import { PortalModule } from './portal/portal.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['../.env', '.env'],
        }),

        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],

            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get<string>('DB_HOST') ?? 'localhost',
                port: Number(configService.get<string>('DB_PORT') ?? 5432),
                username:
                    configService.get<string>('DB_USERNAME')
                    ?? configService.get<string>('POSTGRES_USER'),
                password:
                    configService.get<string>('DB_PASSWORD')
                    ?? configService.get<string>('POSTGRES_PASSWORD'),
                database:
                    configService.get<string>('DB_DATABASE')
                    ?? configService.get<string>('POSTGRES_DB'),

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
        LearningModule,
        PortalModule,
    ],

    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
