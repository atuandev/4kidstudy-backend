import { LearningContentType } from '@prisma/client';

/**
 * Response DTO for learning progress
 */
export class LearningProgressResponseDto {
  id: number;
  userId: number;
  reviewCount: number;
  isMastered: boolean;
  lastReviewedAt?: Date;
  contentType: LearningContentType;
  flashcardId?: number;
  sentenceId?: number;
  createdAt: Date;
  updatedAt: Date;

  // Optional related data
  flashcard?: {
    id: number;
    term: string;
    meaningVi: string;
    imageUrl?: string;
    audioUrl?: string;
    topicId: number;
    topic: {
      id: number;
      grade: string;
    };
  };

  sentence?: {
    id: number;
    text: string;
    meaningVi?: string;
    audioUrl?: string;
    sentenceImageId: number;
    sentenceImage: {
      id: number;
      topicId: number;
      topic: {
        id: number;
        grade: string;
      };
    };
  };
}

/**
 * Response DTO for paginated learning progress
 */
export class PaginatedLearningProgressResponseDto {
  data: LearningProgressResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Response DTO for learning progress statistics
 */
export class LearningProgressStatsResponseDto {
  totalReviewed: number;
  flashcardStats: {
    total: number;
  };
  sentenceStats: {
    total: number;
  };
}
