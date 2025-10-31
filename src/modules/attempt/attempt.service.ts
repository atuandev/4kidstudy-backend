import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateAttemptDto,
  CreateAttemptDetailDto,
  SubmitExerciseDto,
  CompleteAttemptDto,
  GetAttemptsQueryDto,
  AttemptResponseDto,
  PaginatedAttemptsResponseDto,
  AttemptDetailResponseDto,
} from './dto';
import {
  AttemptWithDetails,
  AttemptDetailWithPronunciation,
} from './interfaces/attempt.interface';

/**
 * Service for handling lesson attempts and exercise submissions
 */
@Injectable()
export class AttemptService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Start a new lesson attempt
   */
  async startAttempt(
    userId: number,
    createAttemptDto: CreateAttemptDto,
  ): Promise<AttemptResponseDto> {
    const { lessonId } = createAttemptDto;

    // Verify lesson exists
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { exercises: true },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    // Calculate attempt number for this user and lesson
    const previousAttempts = await this.prisma.attempt.count({
      where: { userId, lessonId },
    });

    // Calculate max possible score
    const maxScore = lesson.exercises.reduce(
      (sum, exercise) => sum + exercise.points,
      0,
    );

    // Create new attempt
    const attempt = await this.prisma.attempt.create({
      data: {
        userId,
        lessonId,
        attemptNumber: previousAttempts + 1,
        maxScore,
      },
      include: {
        details: {
          include: {
            pronunciation: true,
          },
        },
      },
    });

    return this.mapToAttemptResponse(attempt);
  }

  /**
   * Create an attempt detail record
   */
  async createAttemptDetail(
    createAttemptDetailDto: CreateAttemptDetailDto,
  ): Promise<AttemptDetailResponseDto> {
    const {
      attemptId,
      exerciseId,
      isCorrect,
      selectedOptionId,
      timeSec,
      points,
      maxPoints,
      attempts,
      pronunciation,
    } = createAttemptDetailDto;

    // Verify attempt exists
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${attemptId} not found`);
    }

    // Verify exercise exists
    const exercise = await this.prisma.exercise.findUnique({
      where: { id: exerciseId },
    });

    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${exerciseId} not found`);
    }

    // Verify exercise belongs to the lesson in the attempt
    if (exercise.lessonId !== attempt.lessonId) {
      throw new BadRequestException(
        `Exercise ${exerciseId} does not belong to lesson ${attempt.lessonId}`,
      );
    }

    // Calculate points if not provided
    const calculatedPoints = points ?? (isCorrect ? exercise.points : 0);
    const calculatedMaxPoints = maxPoints ?? exercise.points;
    const attemptCount = attempts ?? 1;

    // Create attempt detail
    const detail = await this.prisma.attemptDetail.create({
      data: {
        attemptId,
        exerciseId,
        isCorrect,
        selectedOptionId,
        timeSec,
        points: calculatedPoints,
        maxPoints: calculatedMaxPoints,
        attempts: attemptCount,
      },
      include: { pronunciation: true },
    });

    // Create pronunciation score if provided
    if (pronunciation) {
      await this.prisma.pronunciationScore.create({
        data: {
          attemptDetailId: detail.id,
          accuracy: pronunciation.accuracy,
          fluency: pronunciation.fluency,
          completeness: pronunciation.completeness,
          prosody: pronunciation.prosody,
          overall: pronunciation.overall,
          rawJson: pronunciation.rawJson,
          audioUrl: pronunciation.audioUrl,
        },
      });
    }

    // Recalculate attempt statistics
    await this.recalculateAttemptStats(attemptId);

    // Reload detail with pronunciation
    const updatedDetail = await this.prisma.attemptDetail.findUnique({
      where: { id: detail.id },
      include: { pronunciation: true },
    });

    if (!updatedDetail) {
      throw new NotFoundException(
        `AttemptDetail with ID ${detail.id} not found`,
      );
    }

    return this.mapToAttemptDetailResponse(updatedDetail);
  }

  /**
   * Submit an exercise answer within an attempt
   */
  async submitExercise(
    attemptId: number,
    submitExerciseDto: SubmitExerciseDto,
  ): Promise<AttemptDetailResponseDto> {
    const {
      exerciseId,
      isCorrect,
      selectedOptionId,
      timeSec,
      points,
      pronunciation,
    } = submitExerciseDto;

    // Verify attempt exists and is not completed
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: { lesson: { include: { exercises: true } } },
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${attemptId} not found`);
    }

    if (attempt.isCompleted) {
      throw new BadRequestException('Cannot submit to a completed attempt');
    }

    // Verify exercise belongs to the lesson
    const exercise = attempt.lesson.exercises.find(
      (ex) => ex.id === exerciseId,
    );
    if (!exercise) {
      throw new BadRequestException(
        `Exercise ${exerciseId} does not belong to lesson ${attempt.lessonId}`,
      );
    }

    // Check if this exercise was already answered in this attempt
    const existingDetail = await this.prisma.attemptDetail.findFirst({
      where: { attemptId, exerciseId },
    });

    const calculatedPoints = isCorrect ? (points ?? exercise.points) : 0;
    const attemptCount = existingDetail ? existingDetail.attempts + 1 : 1;

    let detail;
    if (existingDetail) {
      // Update existing detail
      detail = await this.prisma.attemptDetail.update({
        where: { id: existingDetail.id },
        data: {
          isCorrect,
          selectedOptionId,
          timeSec,
          points: calculatedPoints,
          attempts: attemptCount,
        },
        include: { pronunciation: true },
      });
    } else {
      // Create new detail
      detail = await this.prisma.attemptDetail.create({
        data: {
          attemptId,
          exerciseId,
          isCorrect,
          selectedOptionId,
          timeSec,
          points: calculatedPoints,
          maxPoints: exercise.points,
          attempts: attemptCount,
        },
        include: { pronunciation: true },
      });
    }

    // Create pronunciation score if provided
    if (pronunciation && !detail.pronunciation) {
      await this.prisma.pronunciationScore.create({
        data: {
          attemptDetailId: detail.id,
          accuracy: pronunciation.accuracy,
          fluency: pronunciation.fluency,
          completeness: pronunciation.completeness,
          prosody: pronunciation.prosody,
          overall: pronunciation.overall,
          rawJson: pronunciation.rawJson,
          audioUrl: pronunciation.audioUrl,
        },
      });
    } else if (pronunciation && detail.pronunciation) {
      // Update existing pronunciation score
      await this.prisma.pronunciationScore.update({
        where: { attemptDetailId: detail.id },
        data: {
          accuracy: pronunciation.accuracy,
          fluency: pronunciation.fluency,
          completeness: pronunciation.completeness,
          prosody: pronunciation.prosody,
          overall: pronunciation.overall,
          rawJson: pronunciation.rawJson,
          audioUrl: pronunciation.audioUrl,
        },
      });
    }

    // Recalculate attempt statistics
    await this.recalculateAttemptStats(attemptId);

    // Reload detail with pronunciation
    const updatedDetail = await this.prisma.attemptDetail.findUnique({
      where: { id: detail.id },
      include: { pronunciation: true },
    });

    if (!updatedDetail) {
      throw new NotFoundException(
        `AttemptDetail with ID ${detail.id} not found`,
      );
    }

    return this.mapToAttemptDetailResponse(updatedDetail);
  }

  /**
   * Complete an attempt and award XP
   */
  async completeAttempt(
    attemptId: number,
    completeAttemptDto: CompleteAttemptDto,
  ): Promise<AttemptResponseDto> {
    const { durationSec } = completeAttemptDto;

    // Get attempt with details
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        details: true,
        lesson: { include: { exercises: true } },
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${attemptId} not found`);
    }

    if (attempt.isCompleted) {
      throw new BadRequestException('Attempt is already completed');
    }

    // Recalculate final statistics
    await this.recalculateAttemptStats(attemptId);

    // Get updated stats for XP calculation
    const updatedAttemptData = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
    });

    if (!updatedAttemptData) {
      throw new NotFoundException(`Attempt with ID ${attemptId} not found`);
    }

    // Use transaction to ensure atomicity
    const updatedAttempt = await this.prisma.$transaction(async (tx) => {
      // Update attempt as completed
      const completed = await tx.attempt.update({
        where: { id: attemptId },
        data: {
          isCompleted: true,
          durationSec,
        },
        include: {
          details: {
            include: {
              pronunciation: true,
            },
          },
        },
      });

      // Award XP based on the score
      await this.awardXpForAttempt(
        tx,
        attempt.userId,
        attemptId,
        attempt.lessonId,
        updatedAttemptData.totalScore,
      );

      // Update streak
      await this.updateUserStreak(tx, attempt.userId);

      return completed;
    });

    return this.mapToAttemptResponse(updatedAttempt);
  }

  /**
   * Get attempt by ID
   */
  async getAttemptById(attemptId: number): Promise<AttemptResponseDto> {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        details: {
          include: {
            pronunciation: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${attemptId} not found`);
    }

    return this.mapToAttemptResponse(attempt);
  }

  /**
   * Get attempts with pagination and filters
   */
  async getAttempts(
    query: GetAttemptsQueryDto,
  ): Promise<PaginatedAttemptsResponseDto> {
    const { lessonId, userId, page = 1, limit = 10 } = query;

    const where: {
      lessonId?: number;
      userId?: number;
    } = {};
    if (lessonId) where.lessonId = lessonId;
    if (userId) where.userId = userId;

    const [attempts, total] = await Promise.all([
      this.prisma.attempt.findMany({
        where,
        include: {
          details: {
            include: {
              pronunciation: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.attempt.count({ where }),
    ]);

    return {
      data: attempts.map((attempt) => this.mapToAttemptResponse(attempt)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get user's best attempt for a lesson
   */
  async getBestAttempt(
    userId: number,
    lessonId: number,
  ): Promise<AttemptResponseDto | null> {
    const attempt = await this.prisma.attempt.findFirst({
      where: { userId, lessonId, isCompleted: true },
      include: {
        details: {
          include: {
            pronunciation: true,
          },
        },
      },
      orderBy: [{ totalScore: 'desc' }, { accuracyPct: 'desc' }],
    });

    return attempt ? this.mapToAttemptResponse(attempt) : null;
  }

  /**
   * Get user's attempt history for a lesson
   */
  async getUserLessonAttempts(
    userId: number,
    lessonId: number,
  ): Promise<AttemptResponseDto[]> {
    const attempts = await this.prisma.attempt.findMany({
      where: { userId, lessonId },
      include: {
        details: {
          include: {
            pronunciation: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return attempts.map((attempt) => this.mapToAttemptResponse(attempt));
  }

  /**
   * Award XP for completing an attempt
   */
  private async awardXpForAttempt(
    tx: Prisma.TransactionClient,
    userId: number,
    attemptId: number,
    lessonId: number,
    totalScore: number,
  ): Promise<void> {
    // Calculate XP based on score (1:1 ratio for now, can be adjusted)
    const xpAmount = totalScore;
    if (xpAmount <= 0) {
      return;
    }
    // Create XP log entry
    await tx.xPLog.create({
      data: {
        userId,
        amount: xpAmount,
        source: 'LESSON_COMPLETE',
        lessonId,
      },
    });
    // Update user's total XP
    await tx.user.update({
      where: { id: userId },
      data: {
        xp: {
          increment: xpAmount,
        },
      },
    });
  }

  /**
   * Update user's streak days
   */
  private async updateUserStreak(
    tx: Prisma.TransactionClient,
    userId: number,
  ): Promise<void> {
    // Get today's date at midnight (UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    // Check if user already has a streak log for today
    const todayLog = await tx.streakLog.findUnique({
      where: {
        userId_day: {
          userId,
          day: today,
        },
      },
    });
    // If already logged today, just update XP earned
    if (todayLog) {
      // Get today's total XP
      const todayXpLogs = await tx.xPLog.findMany({
        where: {
          userId,
          createdAt: {
            gte: today,
          },
        },
      });
      const totalXpToday = todayXpLogs.reduce(
        (sum, log) => sum + log.amount,
        0,
      );
      await tx.streakLog.update({
        where: { id: todayLog.id },
        data: { xpEarned: totalXpToday },
      });
      return;
    }
    // Get yesterday's date
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    // Check if user practiced yesterday
    const yesterdayLog = await tx.streakLog.findUnique({
      where: {
        userId_day: {
          userId,
          day: yesterday,
        },
      },
    });
    // Get current user data
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { streakDays: true },
    });
    let newStreakDays: number;
    if (yesterdayLog || user?.streakDays === 0) {
      // Continue or start streak
      newStreakDays = (user?.streakDays || 0) + 1;
    } else {
      // Streak broken, reset to 1
      newStreakDays = 1;
    }
    // Update user's streak days
    await tx.user.update({
      where: { id: userId },
      data: { streakDays: newStreakDays },
    });
    // Get today's total XP
    const todayXpLogs = await tx.xPLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: today,
        },
      },
    });
    const totalXpToday = todayXpLogs.reduce((sum, log) => sum + log.amount, 0);
    // Create today's streak log
    await tx.streakLog.create({
      data: {
        userId,
        day: today,
        xpEarned: totalXpToday,
      },
    });
  }

  /**
   * Recalculate attempt statistics based on details
   */
  private async recalculateAttemptStats(attemptId: number): Promise<void> {
    const details = await this.prisma.attemptDetail.findMany({
      where: { attemptId },
    });

    const totalScore = details.reduce((sum, detail) => sum + detail.points, 0);
    const correctCount = details.filter((d) => d.isCorrect).length;
    const incorrectCount = details.filter((d) => !d.isCorrect).length;
    const skipCount = 0; // Can be calculated based on lesson exercises vs details
    const totalExercises = details.length;
    const accuracyPct =
      totalExercises > 0 ? (correctCount / totalExercises) * 100 : 0;

    await this.prisma.attempt.update({
      where: { id: attemptId },
      data: {
        totalScore,
        correctCount,
        incorrectCount,
        skipCount,
        accuracyPct,
      },
    });
  }

  /**
   * Map Prisma attempt to response DTO
   */
  private mapToAttemptResponse(
    attempt: AttemptWithDetails,
  ): AttemptResponseDto {
    return {
      id: attempt.id,
      userId: attempt.userId,
      lessonId: attempt.lessonId,
      durationSec: attempt.durationSec ?? undefined,
      totalScore: attempt.totalScore,
      maxScore: attempt.maxScore,
      accuracyPct: attempt.accuracyPct,
      correctCount: attempt.correctCount,
      incorrectCount: attempt.incorrectCount,
      skipCount: attempt.skipCount,
      attemptNumber: attempt.attemptNumber,
      isCompleted: attempt.isCompleted,
      details: attempt.details
        ? attempt.details.map((detail) =>
            this.mapToAttemptDetailResponse(detail),
          )
        : undefined,
      createdAt: attempt.createdAt,
      updatedAt: attempt.updatedAt,
    };
  }

  /**
   * Map Prisma attempt detail to response DTO
   */
  private mapToAttemptDetailResponse(
    detail: AttemptDetailWithPronunciation,
  ): AttemptDetailResponseDto {
    return {
      id: detail.id,
      attemptId: detail.attemptId,
      exerciseId: detail.exerciseId,
      isCorrect: detail.isCorrect,
      selectedOptionId: detail.selectedOptionId ?? undefined,
      timeSec: detail.timeSec ?? undefined,
      points: detail.points,
      maxPoints: detail.maxPoints,
      attempts: detail.attempts,
      pronunciation: detail.pronunciation
        ? {
            accuracy: detail.pronunciation.accuracy ?? undefined,
            fluency: detail.pronunciation.fluency ?? undefined,
            completeness: detail.pronunciation.completeness ?? undefined,
            prosody: detail.pronunciation.prosody ?? undefined,
            overall: detail.pronunciation.overall ?? undefined,
            audioUrl: detail.pronunciation.audioUrl ?? undefined,
          }
        : undefined,
      createdAt: detail.createdAt,
      updatedAt: detail.updatedAt,
    };
  }
}
