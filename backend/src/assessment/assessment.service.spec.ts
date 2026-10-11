import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentService } from './assessment.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Answer } from '../entities/answer.entity';
import { Question } from '../entities/question.entity';
import { QuizAttemptAnswer } from '../entities/quiz-attempt-answer.entity';
import { QuizAttempt } from '../entities/quiz-attempt.entity';
import { Quiz } from '../entities/quiz.entity';

describe('AssessmentService', () => {
  let service: AssessmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentService,
        Quiz,
        Answer,
        Question,
        QuizAttempt,
        QuizAttemptAnswer,
      ].map((entity) => entity === AssessmentService
        ? entity
        : { provide: getRepositoryToken(entity), useValue: {} }),
    }).compile();

    service = module.get<AssessmentService>(AssessmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
