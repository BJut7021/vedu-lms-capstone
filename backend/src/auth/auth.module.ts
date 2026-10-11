import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { User } from '../entities/user.entity';
import { UserSession } from '../entities/user-session.entity';

import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

@Global()
@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            UserSession,
        ]),

        JwtModule.register({
            secret:
                process.env.JWT_SECRET ||
                'vedu-demo-secret-2026',

            signOptions: {
                expiresIn: '3d',
            },
        }),
    ],

    controllers: [
        AuthController,
    ],

    providers: [
        AuthService,
        JwtAuthGuard,
        RolesGuard,
    ],

    exports: [
        AuthService,
        JwtModule,
        JwtAuthGuard,
        RolesGuard,
    ],
})
export class AuthModule { }
