import { Global, Module } from '@nestjs/common';
import { CoursesModule } from '../courses/courses.module';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { ExamService } from './exam.service';
import { MomoService } from './momo.service';
import { RecommendationService } from './recommendation.service';
import { LearningPathService } from './learning-path.service';
@Global()
@Module({
  imports: [CoursesModule],
  controllers: [PlatformController],
  providers: [PlatformService, ExamService, MomoService, RecommendationService, LearningPathService],
  exports: [ExamService, PlatformService],
})
export class PlatformModule {}
