import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { User } from '../entities/user.entity';
import { UserSession } from '../entities/user-session.entity';

import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { APP_GUARD } from '@nestjs/core';
import { AccessService } from './access.service';
import { ApiPolicyGuard } from './api-policy.guard';
import { AuthRateGuard } from './auth-rate.guard';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserSession]),

    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        if (!secret || secret.length < 32)
          throw new Error('JWT_SECRET cần tối thiểu 32 ký tự trong .env');
        return { secret, signOptions: { expiresIn: 259200 } };
      },
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    JwtAuthGuard,
    RolesGuard,
    AccessService,
    { provide: APP_GUARD, useClass: AuthRateGuard },
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ApiPolicyGuard },
    { provide: APP_GUARD, useExisting: RolesGuard },
  ],

  exports: [AuthService, JwtModule, JwtAuthGuard, RolesGuard, AccessService],
})
export class AuthModule {}
