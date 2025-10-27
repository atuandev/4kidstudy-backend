/**
 * Response DTO for pronunciation score
 */
export class PronunciationScoreResponseDto {
  accuracy?: number;
  fluency?: number;
  completeness?: number;
  prosody?: number;
  overall?: number;
  audioUrl?: string;
}

/**
 * Response DTO for attempt detail
 */
export class AttemptDetailResponseDto {
  id: number;
  attemptId: number;
  exerciseId: number;
  isCorrect: boolean;
  selectedOptionId?: number;
  timeSec?: number;
  points: number;
  maxPoints: number;
  attempts: number;
  pronunciation?: PronunciationScoreResponseDto;
  createdAt: Date;
  updatedAt: Date;
}
