import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for pronunciation score data
 */
export class PronunciationScoreDto {
  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @IsOptional()
  @IsNumber()
  fluency?: number;

  @IsOptional()
  @IsNumber()
  completeness?: number;

  @IsOptional()
  @IsNumber()
  prosody?: number;

  @IsOptional()
  @IsNumber()
  overall?: number;

  @IsOptional()
  rawJson?: any;

  @IsOptional()
  audioUrl?: string;
}

/**
 * DTO for submitting an exercise answer within an attempt
 */
export class SubmitExerciseDto {
  @IsInt()
  @IsNotEmpty()
  exerciseId: number;

  @IsBoolean()
  @IsNotEmpty()
  isCorrect: boolean;

  @IsOptional()
  @IsInt()
  selectedOptionId?: number;

  @IsOptional()
  @IsInt()
  timeSec?: number;

  @IsOptional()
  @IsInt()
  points?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => PronunciationScoreDto)
  pronunciation?: PronunciationScoreDto;
}
