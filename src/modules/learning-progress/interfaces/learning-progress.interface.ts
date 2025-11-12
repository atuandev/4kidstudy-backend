import { LearningProgress, Flashcard, Sentence } from '@prisma/client';

/**
 * Learning progress with flashcard relation
 */
export interface LearningProgressWithFlashcard extends LearningProgress {
  flashcard?: Flashcard | null;
}

/**
 * Learning progress with sentence relation
 */
export interface LearningProgressWithSentence extends LearningProgress {
  sentence?: Sentence | null;
}

/**
 * Learning progress with all relations
 */
export interface LearningProgressWithRelations extends LearningProgress {
  flashcard?: Flashcard | null;
  sentence?: Sentence | null;
}

/**
 * Learning progress with the subset of relation fields we select in queries
 */
export interface LearningProgressWithSelectedRelations
  extends LearningProgress {
  flashcard?: {
    id: number;
    term: string;
    meaningVi: string;
    imageUrl?: string | null;
    audioUrl?: string | null;
    topicId: number;
    topic: {
      id: number;
      grade: string;
    };
  } | null;
  sentence?: {
    id: number;
    text: string;
    meaningVi?: string | null;
    audioUrl?: string | null;
    sentenceImageId: number;
    sentenceImage: {
      id: number;
      topicId: number;
      topic: {
        id: number;
        grade: string;
      };
    };
  } | null;
}
