/**
 * Statistics breakdown per exercise type
 */
export class PracticeStatisticsByTypeDto {
  type: string;
  correctCount: number;
  correctOnSecondCount: number;
  incorrectCount: number;
}

/**
 * Response DTO for user's practice statistics
 */
export class PracticeStatisticsResponseDto {
  completeLessonCount: number;
  totalLessonCount: number;
  totalDurationSec: number;
  totalCorrectCount: number;
  totalIncorrectCount: number;
  byType: PracticeStatisticsByTypeDto[];
}
