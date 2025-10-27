import { Attempt, AttemptDetail, PronunciationScore } from '@prisma/client';

/**
 * Attempt with details relation
 */
export interface AttemptWithDetails extends Attempt {
  details?: AttemptDetailWithPronunciation[];
}

/**
 * AttemptDetail with pronunciation relation
 */
export interface AttemptDetailWithPronunciation extends AttemptDetail {
  pronunciation?: PronunciationScore | null;
}
