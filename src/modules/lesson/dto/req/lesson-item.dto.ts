import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { LessonStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class LessonItemDto {
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
    default: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  order?: number;

  @ApiPropertyOptional({
    description: 'The current status of the lesson',
    enum: LessonStatus,
    default: LessonStatus.DRAFT,
  })
  @IsEnum(LessonStatus)
  @IsOptional()
  status?: LessonStatus;

  @ApiPropertyOptional({
    description: 'Theory content in markdown/plain format',
  })
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
