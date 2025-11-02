import {
  Attempt,
  AttemptDetail,
  PronunciationScore,
  Exercise,
  ExerciseOption,
} from '@prisma/client';

/**
 * Attempt with details relation
 */
export interface AttemptWithDetails extends Attempt {
  details?: AttemptDetailWithPronunciation[];
}

/**
 * Exercise with options relation
 */
export interface ExerciseWithOptions extends Exercise {
  options: ExerciseOption[];
}

/**
 * AttemptDetail with pronunciation and exercise relations
 */
export interface AttemptDetailWithPronunciation extends AttemptDetail {
  pronunciation?: PronunciationScore | null;
  exercise?: ExerciseWithOptions;
}
