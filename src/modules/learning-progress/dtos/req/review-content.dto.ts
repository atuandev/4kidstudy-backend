import {
  IsInt,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { LearningContentType } from '@prisma/client';

/**
 * DTO for reviewing a flashcard or sentence
 */
export class ReviewContentDto {
  @IsEnum(LearningContentType)
  @IsNotEmpty()
  contentType: LearningContentType;

  @IsInt()
  @IsOptional()
  flashcardId?: number;

  @IsInt()
  @IsOptional()
  sentenceId?: number;

  @IsBoolean()
  @IsOptional()
  isMastered?: boolean;
}
