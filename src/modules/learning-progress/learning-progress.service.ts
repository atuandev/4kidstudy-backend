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

/**
 * Service for handling learning progress tracking
 */
@Injectable()
export class LearningProgressService {
  constructor(private readonly prisma: PrismaService) { }

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
    let progress = await this.prisma.learningProgress.findFirst({
      where: {
        userId,
        contentType,
        ...(flashcardId && { flashcardId }),
        ...(sentenceId && { sentenceId }),
      },
    });

    // If progress doesn't exist, create it first
    if (!progress) {
      progress = await this.prisma.learningProgress.create({
        data: {
          userId,
          contentType,
          flashcardId,
          sentenceId,
          reviewCount: 0,
          isMastered: false,
        },
      });
    }

    // Update progress (increment review count and set isMastered if passed in assessment)
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
              topicId: true,
              topic: {
                select: {
                  id: true,
                  grade: true,
                },
              },
            },
          },
          sentence: {
            select: {
              id: true,
              text: true,
              meaningVi: true,
              audioUrl: true,
              sentenceImageId: true,
              sentenceImage: {
                select: {
                  id: true,
                  topicId: true,
                  topic: {
                    select: {
                      id: true,
                      grade: true,
                    },
                  },
                },
              },
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
    const [totalReviewed, flashcardTotal, sentenceTotal] = await Promise.all([
      this.prisma.learningProgress.count({
        where: { userId },
      }),
      this.prisma.learningProgress.count({
        where: { userId, contentType: LearningContentType.FLASHCARD },
      }),
      this.prisma.learningProgress.count({
        where: { userId, contentType: LearningContentType.SENTENCE },
      }),
    ]);

    return {
      totalReviewed,
      flashcardStats: {
        total: flashcardTotal,
      },
      sentenceStats: {
        total: sentenceTotal,
      },
    };
  }

  /**
   * Map learning progress to response DTO
   */
  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  private mapToProgressResponse(
    progress: any, // Using any to handle both cases with and without nested relations
  ): LearningProgressResponseDto {
    const flashcard = progress.flashcard
      ? {
        id: progress.flashcard.id,
        term: progress.flashcard.term,
        meaningVi: progress.flashcard.meaningVi,
        imageUrl: progress.flashcard.imageUrl ?? undefined,
        audioUrl: progress.flashcard.audioUrl ?? undefined,
        ...(progress.flashcard.topicId && {
          topicId: progress.flashcard.topicId,
        }),
        ...(progress.flashcard.topic && {
          topic: progress.flashcard.topic,
        }),
      }
      : undefined;

    const sentence = progress.sentence
      ? {
        id: progress.sentence.id,
        text: progress.sentence.text,
        meaningVi: progress.sentence.meaningVi ?? undefined,
        audioUrl: progress.sentence.audioUrl ?? undefined,
        ...(progress.sentence.sentenceImageId && {
          sentenceImageId: progress.sentence.sentenceImageId,
        }),
        ...(progress.sentence.sentenceImage && {
          sentenceImage: progress.sentence.sentenceImage,
        }),
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
    } as LearningProgressResponseDto;
  }
  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

  /**
   * Get learning progress by topic for a user
   */
  async getTopicProgress(
    userId: number,
    topicId: number,
  ): Promise<{
    topicId: number;
    totalFlashcards: number;
    reviewedFlashcards: number;
    flashcardProgress: number;
    totalSentences: number;
    reviewedSentences: number;
    sentenceProgress: number;
    lastReviewedFlashcardIndex?: number;
    lastReviewedSentenceIndex?: number;
  }> {
    // Count total flashcards in topic (only active ones)
    const totalFlashcards = await this.prisma.flashcard.count({
      where: { topicId, isActive: true },
    });

    // Count mastered flashcards by user in this topic (only isMastered = true)
    const reviewedFlashcards = await this.prisma.learningProgress.count({
      where: {
        userId,
        contentType: LearningContentType.FLASHCARD,
        isMastered: true, // Only count mastered flashcards
        flashcard: {
          topicId,
        },
      },
    });

    // Get all reviewed flashcards to find the one with highest index
    const reviewedFlashcardsList = await this.prisma.learningProgress.findMany({
      where: {
        userId,
        contentType: LearningContentType.FLASHCARD,
        flashcard: {
          topicId,
        },
      },
      include: {
        flashcard: true,
      },
    });

    // Find the index of the furthest reviewed flashcard (highest order)
    let lastReviewedFlashcardIndex: number | undefined = undefined;
    if (reviewedFlashcardsList.length > 0) {
      const allFlashcards = await this.prisma.flashcard.findMany({
        where: { topicId, isActive: true },
        orderBy: { order: 'asc' },
        select: { id: true, order: true },
      });

      // Find the highest index among reviewed flashcards
      let maxIndex = -1;
      reviewedFlashcardsList.forEach((progress) => {
        if (progress.flashcard) {
          const index = allFlashcards.findIndex(
            (f) => f.id === progress.flashcard?.id,
          );
          if (index > maxIndex) {
            maxIndex = index;
          }
        }
      });

      if (maxIndex >= 0) {
        lastReviewedFlashcardIndex = maxIndex;
      }
    }

    // Count total sentences in topic (only active sentences from active sentenceImages)
    const totalSentences = await this.prisma.sentence.count({
      where: {
        isActive: true,
        sentenceImage: {
          topicId,
          isActive: true,
        },
      },
    });

    // Count mastered sentences by user in this topic (only isMastered = true, active sentences only)
    const reviewedSentences = await this.prisma.learningProgress.count({
      where: {
        userId,
        contentType: LearningContentType.SENTENCE,
        isMastered: true, // Only count mastered sentences
        sentence: {
          isActive: true,
          sentenceImage: {
            topicId,
            isActive: true,
          },
        },
      },
    });

    // Get all reviewed sentences to find the one with highest index (only active)
    const reviewedSentencesList = await this.prisma.learningProgress.findMany({
      where: {
        userId,
        contentType: LearningContentType.SENTENCE,
        sentence: {
          isActive: true,
          sentenceImage: {
            topicId,
            isActive: true,
          },
        },
      },
      include: {
        sentence: {
          include: {
            sentenceImage: true,
          },
        },
      },
    });

    // Find the index of the furthest reviewed sentence (highest order)
    let lastReviewedSentenceIndex: number | undefined = undefined;
    if (reviewedSentencesList.length > 0) {
      const allSentenceImages = await this.prisma.sentenceImage.findMany({
        where: { topicId, isActive: true },
        orderBy: { order: 'asc' },
        select: { id: true, order: true },
      });

      // Find the highest index among reviewed sentences
      let maxIndex = -1;
      reviewedSentencesList.forEach((progress) => {
        if (progress.sentence?.sentenceImage) {
          const index = allSentenceImages.findIndex(
            (si) => si.id === progress.sentence?.sentenceImageId,
          );
          if (index > maxIndex) {
            maxIndex = index;
          }
        }
      });

      if (maxIndex >= 0) {
        lastReviewedSentenceIndex = maxIndex;
      }
    }

    // Calculate percentages
    const flashcardProgress =
      totalFlashcards > 0
        ? Math.round((reviewedFlashcards / totalFlashcards) * 100 * 10) / 10
        : 0;

    const sentenceProgress =
      totalSentences > 0
        ? Math.round((reviewedSentences / totalSentences) * 100 * 10) / 10
        : 0;

    return {
      topicId,
      totalFlashcards,
      reviewedFlashcards,
      flashcardProgress,
      totalSentences,
      reviewedSentences,
      sentenceProgress,
      lastReviewedFlashcardIndex,
      lastReviewedSentenceIndex,
    };
  }

  /**
   * Get mastered flashcard IDs for a specific topic (isMastered = true)
   */
  async getReviewedFlashcardIds(
    userId: number,
    topicId: number,
  ): Promise<number[]> {
    const progressList = await this.prisma.learningProgress.findMany({
      where: {
        userId,
        contentType: LearningContentType.FLASHCARD,
        isMastered: true, // Only get mastered flashcards
        flashcard: {
          topicId,
        },
      },
      select: {
        flashcardId: true,
      },
    });

    return progressList
      .map((p) => p.flashcardId)
      .filter((id): id is number => id !== null);
  }

  /**
   * Get mastered sentence IDs for a specific topic (isMastered = true)
   */
  async getReviewedSentenceIds(
    userId: number,
    topicId: number,
  ): Promise<number[]> {
    const progressList = await this.prisma.learningProgress.findMany({
      where: {
        userId,
        contentType: LearningContentType.SENTENCE,
        isMastered: true, // Only get mastered sentences
        sentence: {
          sentenceImage: {
            topicId,
          },
        },
      },
      select: {
        sentenceId: true,
      },
    });

    return progressList
      .map((p) => p.sentenceId)
      .filter((id): id is number => id !== null);
  }

  /**
   * Get the last reviewed topic ID for a user
   */
  async getLastReviewedTopic(userId: number): Promise<number | null> {
    // Get the most recent learning progress entry
    const lastProgress = await this.prisma.learningProgress.findFirst({
      where: {
        userId,
      },
      include: {
        flashcard: {
          select: {
            topicId: true,
          },
        },
        sentence: {
          select: {
            sentenceImage: {
              select: {
                topicId: true,
              },
            },
          },
        },
      },
      orderBy: {
        lastReviewedAt: 'desc',
      },
    });

    if (!lastProgress) {
      return null;
    }

    // Return topicId from flashcard or sentence
    if (lastProgress.flashcard) {
      return lastProgress.flashcard.topicId;
    }

    if (lastProgress.sentence?.sentenceImage) {
      return lastProgress.sentence.sentenceImage.topicId;
    }

    return null;
  }
}
