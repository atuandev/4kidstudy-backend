import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExerciseType } from '@prisma/client';

/**
 * Response DTO for pronunciation score
 */
export class PronunciationScoreResponseDto {
  @ApiPropertyOptional({
    description: 'Pronunciation accuracy score',
    example: 85.5,
  })
  accuracy?: number;

  @ApiPropertyOptional({
    description: 'Pronunciation fluency score',
    example: 80.0,
  })
  fluency?: number;

  @ApiPropertyOptional({
    description: 'Pronunciation completeness score',
    example: 90.0,
  })
  completeness?: number;

  @ApiPropertyOptional({
    description: 'Pronunciation prosody score',
    example: 75.0,
  })
  prosody?: number;

  @ApiPropertyOptional({
    description: 'Overall pronunciation score',
    example: 82.5,
  })
  overall?: number;

  @ApiPropertyOptional({
    description: 'URL to the recorded pronunciation audio',
    example: 'https://example.com/audio/pronunciation.mp3',
  })
  audioUrl?: string;
}

/**
 * Response DTO for exercise option
 */
export class ExerciseOptionResponseDto {
  @ApiProperty({ description: 'Option ID', example: 1 })
  id: number;

  @ApiProperty({
    description: 'Exercise ID this option belongs to',
    example: 1,
  })
  exerciseId: number;

  @ApiPropertyOptional({ description: 'Option text', example: 'Apple' })
  text?: string;

  @ApiPropertyOptional({
    description: 'Option image URL',
    example: 'https://example.com/images/apple.jpg',
  })
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Option audio URL',
    example: 'https://example.com/audio/apple.mp3',
  })
  audioUrl?: string;

  @ApiProperty({
    description: 'Whether this option is correct',
    example: true,
  })
  isCorrect: boolean;

  @ApiProperty({ description: 'Order of this option', example: 0 })
  order: number;

  @ApiPropertyOptional({
    description: 'Match key for matching exercises',
    example: 'pair_1',
  })
  matchKey?: string;
}

/**
 * Response DTO for exercise
 */
export class ExerciseResponseDto {
  @ApiProperty({ description: 'Exercise ID', example: 1 })
  id: number;

  @ApiProperty({
    description: 'Lesson ID this exercise belongs to',
    example: 1,
  })
  lessonId: number;

  @ApiProperty({
    description: 'Type of exercise',
    enum: ExerciseType,
    example: ExerciseType.MULTIPLE_CHOICE,
  })
  type: ExerciseType;

  @ApiProperty({
    description: 'Order of this exercise in the lesson',
    example: 0,
  })
  order: number;

  @ApiPropertyOptional({
    description: 'Exercise prompt or question text',
    example: 'What is this?',
  })
  prompt?: string;

  @ApiPropertyOptional({
    description: 'Exercise image URL',
    example: 'https://example.com/images/exercise.jpg',
  })
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Exercise audio URL',
    example: 'https://example.com/audio/exercise.mp3',
  })
  audioUrl?: string;

  @ApiPropertyOptional({
    description: 'Target text for pronunciation or listening exercises',
    example: 'Hello world',
  })
  targetText?: string;

  @ApiPropertyOptional({
    description: 'Hint in English',
    example: 'Think about colors',
  })
  hintEn?: string;

  @ApiPropertyOptional({
    description: 'Hint in Vietnamese',
    example: 'Nghĩ về màu sắc',
  })
  hintVi?: string;

  @ApiProperty({ description: 'Points for this exercise', example: 10 })
  points: number;

  @ApiProperty({ description: 'Difficulty level (1-3)', example: 1 })
  difficulty: number;

  @ApiProperty({
    description: 'Exercise options',
    type: [ExerciseOptionResponseDto],
  })
  options: ExerciseOptionResponseDto[];

  @ApiProperty({
    description: 'Creation date',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2024-01-01T00:00:00Z',
  })
  updatedAt: Date;
}

/**
 * Response DTO for attempt detail
 */
export class AttemptDetailResponseDto {
  @ApiProperty({ description: 'Attempt detail ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Attempt ID', example: 1 })
  attemptId: number;

  @ApiProperty({ description: 'Exercise ID', example: 1 })
  exerciseId: number;

  @ApiProperty({
    description: 'Whether the answer was correct',
    example: true,
  })
  isCorrect: boolean;

  @ApiPropertyOptional({
    description: 'ID of the first selected option',
    example: 5,
  })
  selectedOptionId?: number;

  @ApiPropertyOptional({
    description: 'ID of the second selected option (for matching exercises)',
    example: 8,
  })
  selectedOption2Id?: number;

  @ApiPropertyOptional({
    description: 'Time taken to answer in seconds',
    example: 15,
  })
  timeSec?: number;

  @ApiProperty({ description: 'Points earned', example: 10 })
  points: number;

  @ApiProperty({ description: 'Maximum points possible', example: 10 })
  maxPoints: number;

  @ApiProperty({
    description: 'Number of attempts made for this exercise',
    example: 1,
  })
  attempts: number;

  @ApiPropertyOptional({
    description: 'Pronunciation score if applicable',
    type: PronunciationScoreResponseDto,
  })
  pronunciation?: PronunciationScoreResponseDto;

  @ApiPropertyOptional({
    description: 'Exercise details',
    type: ExerciseResponseDto,
  })
  exercise?: ExerciseResponseDto;

  @ApiProperty({
    description: 'Creation date',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2024-01-01T00:00:00Z',
  })
  updatedAt: Date;
}
