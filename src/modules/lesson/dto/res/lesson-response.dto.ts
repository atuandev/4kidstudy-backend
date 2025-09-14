import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LessonStatus } from '@prisma/client';

export class LessonResponseDto {
  @ApiProperty({ description: 'Unique identifier for the lesson' })
  id: number;

  @ApiProperty({ description: 'The ID of the topic this lesson belongs to' })
  topicId: number;

  @ApiProperty({ description: 'The title of the lesson' })
  title: string;

  @ApiPropertyOptional({ description: 'A description of the lesson content' })
  description?: string;

  @ApiProperty({ description: 'The order of the lesson within its topic' })
  order: number;

  @ApiProperty({ 
    description: 'The current status of the lesson',
    enum: LessonStatus
  })
  status: LessonStatus;

  @ApiPropertyOptional({ description: 'Theory content in markdown/plain format' })
  theoryText?: string;

  @ApiPropertyOptional({ description: 'Notes about the phonetics' })
  phoneticsNote?: string;

  @ApiPropertyOptional({ description: 'Notes about the grammar' })
  grammarNote?: string;

  @ApiPropertyOptional({ description: 'URL to the audio content' })
  audioUrl?: string;

  @ApiPropertyOptional({ description: 'URL to the cover image' })
  coverImage?: string;

  @ApiProperty({ description: 'When the lesson was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When the lesson was last updated' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'The topic this lesson belongs to' })
  topic?: any;

  @ApiPropertyOptional({ description: 'The exercises within this lesson' })
  exercises?: any[];

  @ApiPropertyOptional({ description: 'Count of exercises in this lesson' })
  _count?: {
    exercises: number;
  };
}