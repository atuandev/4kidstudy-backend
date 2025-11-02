import { Test, TestingModule } from '@nestjs/testing';
import { LearningProgressController } from './learning-progress.controller';
import { LearningProgressService } from './learning-progress.service';

describe('LearningProgressController', () => {
  let controller: LearningProgressController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LearningProgressController],
      providers: [
        {
          provide: LearningProgressService,
          useValue: {
            getOrCreateProgress: jest.fn(),
            reviewContent: jest.fn(),
            getProgressById: jest.fn(),
            getUserProgress: jest.fn(),
            updateProgress: jest.fn(),
            deleteProgress: jest.fn(),
            getUserStats: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<LearningProgressController>(
      LearningProgressController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
