import { Global, Module } from '@nestjs/common';
import { CoursesModule } from '../courses/courses.module';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { ExamService } from './exam.service';
import { FinalEssayService } from './final-essay.service';
import { MomoService } from './momo.service';
import { RecommendationService } from './recommendation.service';
import { LearningPathService } from './learning-path.service';
import { ManualPaymentService } from './manual-payment.service';
@Global()
@Module({
  imports: [CoursesModule],
  controllers: [PlatformController],
  providers: [
    PlatformService,
    ExamService,
    FinalEssayService,
    MomoService,
    RecommendationService,
    LearningPathService,
    ManualPaymentService,
  ],
  exports: [ExamService, PlatformService],
})
export class PlatformModule {}
