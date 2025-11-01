import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LearningContentType } from '@prisma/client';
import {
  CreateLearningProgressDto,
  UpdateLearningProgressDto,
  GetLearningProgressQueryDto,
  ReviewContentDto,
  LearningProgressResponseDto,
  PaginatedLearningProgressResponseDto,
  LearningProgressStatsResponseDto,
} from './dtos';
import { LearningProgressWithSelectedRelations } from './interfaces/learning-progress.interface';

/**
 * Service for handling learning progress tracking
 */
@Injectable()
export class LearningProgressService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create learning progress for a user and content
   */
  async getOrCreateProgress(
    userId: number,
    createDto: CreateLearningProgressDto,
  ): Promise<LearningProgressResponseDto> {
    const { contentType, flashcardId, sentenceId } = createDto;

    // Validate that either flashcardId or sentenceId is provided based on contentType
    if (contentType === LearningContentType.FLASHCARD && !flashcardId) {
      throw new BadRequestException(
        'flashcardId is required for FLASHCARD content type',
      );
    }

    if (contentType === LearningContentType.SENTENCE && !sentenceId) {
      throw new BadRequestException(
        'sentenceId is required for SENTENCE content type',
      );
    }

    // Check if progress already exists
    const existingProgress = await this.prisma.learningProgress.findFirst({
      where: {
        userId,
        contentType,
        ...(flashcardId && { flashcardId }),
        ...(sentenceId && { sentenceId }),
      },
      include: {
        flashcard: flashcardId
          ? {
              select: {
                id: true,
                term: true,
                meaningVi: true,
                imageUrl: true,
                audioUrl: true,
              },
            }
          : false,
        sentence: sentenceId
          ? {
              select: {
                id: true,
                text: true,
                meaningVi: true,
                audioUrl: true,
              },
            }
          : false,
      },
    });

    if (existingProgress) {
      return this.mapToProgressResponse(existingProgress);
    }

    // Verify content exists
    if (flashcardId) {
      const flashcard = await this.prisma.flashcard.findUnique({
        where: { id: flashcardId },
      });
      if (!flashcard) {
        throw new NotFoundException(
          `Flashcard with ID ${flashcardId} not found`,
        );
      }
    }

    if (sentenceId) {
      const sentence = await this.prisma.sentence.findUnique({
        where: { id: sentenceId },
      });
      if (!sentence) {
        throw new NotFoundException(`Sentence with ID ${sentenceId} not found`);
      }
    }

    // Create new progress
    const progress = await this.prisma.learningProgress.create({
      data: {
        userId,
        contentType,
        flashcardId,
        sentenceId,
      },
      include: {
        flashcard: flashcardId
          ? {
              select: {
                id: true,
                term: true,
                meaningVi: true,
                imageUrl: true,
                audioUrl: true,
              },
            }
          : false,
        sentence: sentenceId
          ? {
              select: {
                id: true,
                text: true,
                meaningVi: true,
                audioUrl: true,
              },
            }
          : false,
      },
    });

    return this.mapToProgressResponse(progress);
  }

  /**
   * Review content (increment review count and optionally mark as mastered)
   */
  async reviewContent(
    userId: number,
    reviewDto: ReviewContentDto,
  ): Promise<LearningProgressResponseDto> {
    const { contentType, flashcardId, sentenceId, isMastered } = reviewDto;

    // Find existing progress
    const progress = await this.prisma.learningProgress.findFirst({
      where: {
        userId,
        contentType,
        ...(flashcardId && { flashcardId }),
        ...(sentenceId && { sentenceId }),
      },
    });

    if (!progress) {
      throw new NotFoundException('Learning progress not found');
    }

    // Update progress
    const updatedProgress = await this.prisma.learningProgress.update({
      where: { id: progress.id },
      data: {
        reviewCount: { increment: 1 },
        lastReviewedAt: new Date(),
        ...(isMastered !== undefined && { isMastered }),
      },
      include: {
        flashcard: flashcardId
          ? {
              select: {
                id: true,
                term: true,
                meaningVi: true,
                imageUrl: true,
                audioUrl: true,
              },
            }
          : false,
        sentence: sentenceId
          ? {
              select: {
                id: true,
                text: true,
                meaningVi: true,
                audioUrl: true,
              },
            }
          : false,
      },
    });

    return this.mapToProgressResponse(updatedProgress);
  }

  /**
   * Get learning progress by ID
   */
  async getProgressById(
    id: number,
    userId: number,
  ): Promise<LearningProgressResponseDto> {
    const progress = await this.prisma.learningProgress.findFirst({
      where: { id, userId },
      include: {
        flashcard: {
          select: {
            id: true,
            term: true,
            meaningVi: true,
            imageUrl: true,
            audioUrl: true,
          },
        },
        sentence: {
          select: {
            id: true,
            text: true,
            meaningVi: true,
            audioUrl: true,
          },
        },
      },
    });

    if (!progress) {
      throw new NotFoundException(`Learning progress with ID ${id} not found`);
    }

    return this.mapToProgressResponse(progress);
  }

  /**
   * Get paginated learning progress for a user
   */
  async getUserProgress(
    userId: number,
    query: GetLearningProgressQueryDto,
  ): Promise<PaginatedLearningProgressResponseDto> {
    const {
      page = 1,
      limit = 10,
      contentType,
      flashcardId,
      sentenceId,
      isMastered,
    } = query;

    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(contentType && { contentType }),
      ...(flashcardId && { flashcardId }),
      ...(sentenceId && { sentenceId }),
      ...(isMastered !== undefined && { isMastered }),
    };

    const [data, total] = await Promise.all([
      this.prisma.learningProgress.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastReviewedAt: 'desc' },
        include: {
          flashcard: {
            select: {
              id: true,
              term: true,
              meaningVi: true,
              imageUrl: true,
              audioUrl: true,
            },
          },
          sentence: {
            select: {
              id: true,
              text: true,
              meaningVi: true,
              audioUrl: true,
            },
          },
        },
      }),
      this.prisma.learningProgress.count({ where }),
    ]);

    return {
      data: data.map((progress) => this.mapToProgressResponse(progress)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update learning progress
   */
  async updateProgress(
    id: number,
    userId: number,
    updateDto: UpdateLearningProgressDto,
  ): Promise<LearningProgressResponseDto> {
    // Verify progress exists and belongs to user
    const progress = await this.prisma.learningProgress.findFirst({
      where: { id, userId },
    });

    if (!progress) {
      throw new NotFoundException(`Learning progress with ID ${id} not found`);
    }

    const updated = await this.prisma.learningProgress.update({
      where: { id },
      data: {
        ...updateDto,
        ...(updateDto.lastReviewedAt && {
          lastReviewedAt: new Date(updateDto.lastReviewedAt),
        }),
      },
      include: {
        flashcard: progress.flashcardId
          ? {
              select: {
                id: true,
                term: true,
                meaningVi: true,
                imageUrl: true,
                audioUrl: true,
              },
            }
          : false,
        sentence: progress.sentenceId
          ? {
              select: {
                id: true,
                text: true,
                meaningVi: true,
                audioUrl: true,
              },
            }
          : false,
      },
    });

    return this.mapToProgressResponse(updated);
  }

  /**
   * Delete learning progress
   */
  async deleteProgress(id: number, userId: number): Promise<void> {
    const progress = await this.prisma.learningProgress.findFirst({
      where: { id, userId },
    });

    if (!progress) {
      throw new NotFoundException(`Learning progress with ID ${id} not found`);
    }

    await this.prisma.learningProgress.delete({
      where: { id },
    });
  }

  /**
   * Get learning progress statistics for a user
   */
  async getUserStats(
    userId: number,
  ): Promise<LearningProgressStatsResponseDto> {
    const [
      totalReviewed,
      totalMastered,
      flashcardTotal,
      flashcardMastered,
      sentenceTotal,
      sentenceMastered,
    ] = await Promise.all([
      this.prisma.learningProgress.count({
        where: { userId },
      }),
      this.prisma.learningProgress.count({
        where: { userId, isMastered: true },
      }),
      this.prisma.learningProgress.count({
        where: { userId, contentType: LearningContentType.FLASHCARD },
      }),
      this.prisma.learningProgress.count({
        where: {
          userId,
          contentType: LearningContentType.FLASHCARD,
          isMastered: true,
        },
      }),
      this.prisma.learningProgress.count({
        where: { userId, contentType: LearningContentType.SENTENCE },
      }),
      this.prisma.learningProgress.count({
        where: {
          userId,
          contentType: LearningContentType.SENTENCE,
          isMastered: true,
        },
      }),
    ]);

    return {
      totalReviewed,
      totalMastered,
      masteryRate:
        totalReviewed > 0 ? (totalMastered / totalReviewed) * 100 : 0,
      flashcardStats: {
        total: flashcardTotal,
        mastered: flashcardMastered,
        inProgress: flashcardTotal - flashcardMastered,
      },
      sentenceStats: {
        total: sentenceTotal,
        mastered: sentenceMastered,
        inProgress: sentenceTotal - sentenceMastered,
      },
    };
  }

  /**
   * Map learning progress to response DTO
   */
  private mapToProgressResponse(
    progress: LearningProgressWithSelectedRelations,
  ): LearningProgressResponseDto {
    const flashcard = progress.flashcard
      ? {
          id: progress.flashcard.id,
          term: progress.flashcard.term,
          meaningVi: progress.flashcard.meaningVi,
          imageUrl: progress.flashcard.imageUrl ?? undefined,
          audioUrl: progress.flashcard.audioUrl ?? undefined,
        }
      : undefined;

    const sentence = progress.sentence
      ? {
          id: progress.sentence.id,
          text: progress.sentence.text,
          meaningVi: progress.sentence.meaningVi ?? undefined,
          audioUrl: progress.sentence.audioUrl ?? undefined,
        }
      : undefined;

    return {
      id: progress.id,
      userId: progress.userId,
      reviewCount: progress.reviewCount,
      isMastered: progress.isMastered,
      lastReviewedAt: progress.lastReviewedAt ?? undefined,
      contentType: progress.contentType,
      flashcardId: progress.flashcardId ?? undefined,
      sentenceId: progress.sentenceId ?? undefined,
      createdAt: progress.createdAt,
      updatedAt: progress.updatedAt,
      ...(flashcard && { flashcard }),
      ...(sentence && { sentence }),
    };
  }
}
