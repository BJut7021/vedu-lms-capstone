import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { UserRole } from '../entities/user.entity';
import { LearningService } from './learning.service';

type AuthenticatedRequest = Request & {
  user: {
    userId: number;
    email: string;
    role: UserRole;
  };
};

@Controller('api/learning')
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  @UseGuards(JwtAuthGuard)
  @Post('events')
  logEvent(
    @Req() request: AuthenticatedRequest,
    @Body()
    body: {
      eventUuid: string;
      learningSessionId: string;
      courseId: number;
      lessonId?: number;
      quizId?: number;
      quizAttemptId?: number;
      action: string;
      quizScore?: number;
      durationSeconds?: number;
      completionStatus?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    return this.learningService.logEvent(request.user.userId, body);
  }
}
