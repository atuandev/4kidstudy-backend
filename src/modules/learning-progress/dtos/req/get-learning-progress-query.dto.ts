import { IsInt, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { LearningContentType } from '@prisma/client';

/**
 * DTO for querying learning progress list
 */
export class GetLearningProgressQueryDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @IsEnum(LearningContentType)
  @IsOptional()
  contentType?: LearningContentType;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  flashcardId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  sentenceId?: number;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isMastered?: boolean;
}
