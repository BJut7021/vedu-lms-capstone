import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { Public } from '../auth/public.decorator';

import { Request } from 'express';

import { UsersService } from './users.service';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { RolesGuard } from '../auth/roles.guard';

import { Roles } from '../auth/roles.decorator';

import { UserRole } from '../entities/user.entity';

type AuthenticatedRequest = Request & {
  user: {
    userId: number;
    email: string;
    role: UserRole;
  };
};

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('me/avatar')
  @Roles('STUDENT', 'TEACHER')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  )
  uploadAvatar(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file?: { buffer: Buffer },
  ) {
    return this.usersService.uploadAvatar(request.user.userId, file?.buffer);
  }

  @Public()
  @Get('avatars/:filename')
  async avatar(@Param('filename') filename: string, @Res() response: Response) {
    const path = await this.usersService.avatarPath(filename);
    response.setHeader('Content-Type', 'image/jpeg');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cache-Control', 'public,max-age=31536000,immutable');
    response.sendFile(path);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() request: AuthenticatedRequest) {
    return this.usersService.findOne(request.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(
    @Req() request: AuthenticatedRequest,
    @Body()
    body: {
      fullName?: string;
      email?: string;
      avatarUrl?: string | null;
    },
  ) {
    return this.usersService.updateMe(request.user.userId, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(
    @Body()
    body: {
      fullName: string;
      username: string;
      email: string;
      phone: string;
      password: string;
      role?: UserRole;
    },
  ) {
    return this.usersService.create(
      body.fullName,
      body.username,
      body.email,
      body.phone,
      body.password,
      body.role ?? 'STUDENT',
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.usersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  adminUpdate(
    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    body: {
      fullName?: string;
      email?: string;
      avatarUrl?: string | null;
      role?: UserRole;
      isActive?: boolean;
    },
  ) {
    return this.usersService.adminUpdate(id, body);
  }
}
