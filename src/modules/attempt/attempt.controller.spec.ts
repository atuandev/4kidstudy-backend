import { Test, TestingModule } from '@nestjs/testing';
import { AttemptController } from './attempt.controller';
import { AttemptService } from './attempt.service';

describe('AttemptController', () => {
  let controller: AttemptController;
  let service: AttemptService;

  const mockAttemptService = {
    startAttempt: jest.fn(),
    submitExercise: jest.fn(),
    completeAttempt: jest.fn(),
    getAttemptById: jest.fn(),
    getAttempts: jest.fn(),
    getBestAttempt: jest.fn(),
    getUserLessonAttempts: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttemptController],
      providers: [
        {
          provide: AttemptService,
          useValue: mockAttemptService,
        },
      ],
    }).compile();

    controller = module.get<AttemptController>(AttemptController);
    service = module.get<AttemptService>(AttemptService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('startAttempt', () => {
    it('should start a new attempt', async () => {
      const createAttemptDto = { lessonId: 1 };
      const userId = 1;
      const mockRequest = { user: { sub: userId } };
      const expectedResult = {
        id: 1,
        userId,
        lessonId: 1,
        totalScore: 0,
        maxScore: 100,
        accuracyPct: 0,
        correctCount: 0,
        incorrectCount: 0,
        skipCount: 0,
        attemptNumber: 1,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAttemptService.startAttempt.mockResolvedValue(expectedResult);

      const result = await controller.startAttempt(
        mockRequest,
        createAttemptDto,
      );

      expect(result).toEqual(expectedResult);
      expect(service.startAttempt).toHaveBeenCalledWith(
        userId,
        createAttemptDto,
      );
    });
  });
});
