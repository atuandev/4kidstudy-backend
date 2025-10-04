import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExerciseType } from '@prisma/client';
import { ExerciseOptionDto } from '../req/exercise-option.dto';

export class ExerciseDto {
  @ApiProperty({ description: 'Unique identifier for the exercise' })
  id: number;

  @ApiProperty({ description: 'ID of the lesson this exercise belongs to' })
  lessonId: number;

  @ApiProperty({
    description: 'Type of exercise',
    enum: ExerciseType,
    enumName: 'ExerciseType',
  })
  type: ExerciseType;

  @ApiProperty({ description: 'Order/position of this exercise in the lesson' })
  order: number;

  @ApiPropertyOptional({
    description: 'Question text or instructions for the exercise',
  })
  prompt?: string;

  @ApiPropertyOptional({ description: 'URL to the image for this exercise' })
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'URL to the audio for this exercise' })
  audioUrl?: string;

  @ApiPropertyOptional({
    description:
      'Target text for pronunciation or expected answer for listening',
  })
  targetText?: string;

  @ApiPropertyOptional({
    description: 'Hint text in English',
  })
  hintEn?: string;

  @ApiPropertyOptional({
    description: 'Hint text in Vietnamese',
  })
  hintVi?: string;

  @ApiProperty({
    description: 'Points earned for correctly answering this exercise',
  })
  points: number;

  @ApiProperty({ description: 'Difficulty level (1-3)' })
  difficulty: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiProperty({
    type: [ExerciseOptionDto],
    description: 'Options for this exercise',
  })
  options: ExerciseOptionDto[];
}
