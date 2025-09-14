import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { 
  IsEnum, 
  IsInt, 
  IsNotEmpty, 
  IsOptional, 
  IsPositive, 
  IsString, 
  MaxLength, 
  Min 
} from 'class-validator';
import { LessonStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateLessonDto {
  @ApiProperty({ description: 'The ID of the topic this lesson belongs to' })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  topicId: number;

  @ApiProperty({ description: 'The title of the lesson' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiPropertyOptional({ description: 'A description of the lesson content' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ 
    description: 'The order of the lesson within its topic',
    default: 0
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  order?: number;

  @ApiPropertyOptional({ 
    description: 'The current status of the lesson',
    enum: LessonStatus,
    default: LessonStatus.DRAFT
  })
  @IsEnum(LessonStatus)
  @IsOptional()
  status?: LessonStatus;

  @ApiPropertyOptional({ description: 'Theory content in markdown/plain format' })
  @IsString()
  @IsOptional()
  theoryText?: string;

  @ApiPropertyOptional({ description: 'Notes about the phonetics' })
  @IsString()
  @IsOptional()
  phoneticsNote?: string;

  @ApiPropertyOptional({ description: 'Notes about the grammar' })
  @IsString()
  @IsOptional()
  grammarNote?: string;

  @ApiPropertyOptional({ description: 'URL to the audio content' })
  @IsString()
  @IsOptional()
  audioUrl?: string;

  @ApiPropertyOptional({ description: 'URL to the cover image' })
  @IsString()
  @IsOptional()
  coverImage?: string;
}

export class UpdateLessonDto extends PartialType(CreateLessonDto) {}

export class LessonQueryParamsDto {
  @ApiPropertyOptional({ description: 'Number of items to skip', default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  skip?: number;

  @ApiPropertyOptional({ description: 'Number of items to take', default: 10 })
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  take?: number;

  @ApiPropertyOptional({ description: 'Filter by topic ID' })
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  topicId?: number;

  @ApiPropertyOptional({ 
    description: 'Filter by status',
    enum: LessonStatus
  })
  @IsEnum(LessonStatus)
  @IsOptional()
  status?: string;
}

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
