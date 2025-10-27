import {
  IsInt,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PronunciationScoreDto } from './submit-exercise.dto';

/**
 * DTO for creating an attempt detail record
 */
export class CreateAttemptDetailDto {
  @IsInt()
  @IsNotEmpty()
  attemptId: number;

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
  @IsInt()
  maxPoints?: number;

  @IsOptional()
  @IsInt()
  attempts?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => PronunciationScoreDto)
  pronunciation?: PronunciationScoreDto;
}
