import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for topic learning progress
 */
export class TopicProgressResponseDto {
  @ApiProperty({
    description: 'Topic ID',
    example: 1,
  })
  topicId: number;

  @ApiProperty({
    description: 'Total number of flashcards in the topic',
    example: 20,
  })
  totalFlashcards: number;

  @ApiProperty({
    description: 'Number of flashcards reviewed by the user',
    example: 15,
  })
  reviewedFlashcards: number;

  @ApiProperty({
    description: 'Percentage of flashcards reviewed',
    example: 75.0,
  })
  flashcardProgress: number;

  @ApiProperty({
    description: 'Total number of sentences in the topic',
    example: 10,
  })
  totalSentences: number;

  @ApiProperty({
    description: 'Number of sentences reviewed by the user',
    example: 8,
  })
  reviewedSentences: number;

  @ApiProperty({
    description: 'Percentage of sentences reviewed',
    example: 80.0,
  })
  sentenceProgress: number;

  @ApiProperty({
    description: 'Index of the last reviewed flashcard (0-based)',
    example: 14,
    required: false,
  })
  lastReviewedFlashcardIndex?: number;

  @ApiProperty({
    description: 'Index of the last reviewed sentence (0-based)',
    example: 7,
    required: false,
  })
  lastReviewedSentenceIndex?: number;
}
