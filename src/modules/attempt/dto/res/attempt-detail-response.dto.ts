import { ExerciseType } from '@prisma/client';

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
 * Response DTO for exercise option
 */
export class ExerciseOptionResponseDto {
  id: number;
  exerciseId: number;
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  isCorrect: boolean;
  order: number;
  matchKey?: string;
}

/**
 * Response DTO for exercise
 */
export class ExerciseResponseDto {
  id: number;
  lessonId: number;
  type: ExerciseType;
  order: number;
  prompt?: string;
  imageUrl?: string;
  audioUrl?: string;
  targetText?: string;
  hintEn?: string;
  hintVi?: string;
  points: number;
  difficulty: number;
  options: ExerciseOptionResponseDto[];
  createdAt: Date;
  updatedAt: Date;
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
  exercise?: ExerciseResponseDto;
  createdAt: Date;
  updatedAt: Date;
}
