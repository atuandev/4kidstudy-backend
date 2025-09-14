import { ApiProperty } from '@nestjs/swagger';
import { GradeLevel } from './create-topic.dto';

export class TopicStatsDto {
  @ApiProperty({ example: 1 })
  topicId: number;

  @ApiProperty({ example: 'Animals and Pets' })
  title: string;

  @ApiProperty({ enum: GradeLevel, example: GradeLevel.GRADE_1 })
  grade: GradeLevel;

  @ApiProperty({ example: 5 })
  totalLessons: number;

  @ApiProperty({ example: 20 })
  totalFlashcards: number;

  @ApiProperty({ example: 15 })
  totalExercises: number;

  @ApiProperty({ example: 100 })
  totalAttempts: number;
}