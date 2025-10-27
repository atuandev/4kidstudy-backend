import { AttemptDetailResponseDto } from './attempt-detail-response.dto';

/**
 * Response DTO for attempt
 */
export class AttemptResponseDto {
  id: number;
  userId: number;
  lessonId: number;
  durationSec?: number;
  totalScore: number;
  maxScore: number;
  accuracyPct: number;
  correctCount: number;
  incorrectCount: number;
  skipCount: number;
  attemptNumber: number;
  isCompleted: boolean;
  details?: AttemptDetailResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Response DTO for paginated attempts
 */
export class PaginatedAttemptsResponseDto {
  data: AttemptResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
