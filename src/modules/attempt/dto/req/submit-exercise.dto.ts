import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  @ApiProperty({
    description: 'Exercise ID',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  exerciseId: number;

  @ApiProperty({
    description: 'Whether the answer is correct',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  isCorrect: boolean;

  @ApiPropertyOptional({
    description: 'ID of the first selected option',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  selectedOptionId?: number;

  @ApiPropertyOptional({
    description: 'ID of the second selected option (for matching exercises)',
    example: 8,
  })
  @IsOptional()
  @IsInt()
  selectedOption2Id?: number;

  @ApiPropertyOptional({
    description: 'Time taken to answer in seconds',
    example: 15,
  })
  @IsOptional()
  @IsInt()
  timeSec?: number;

  @ApiPropertyOptional({
    description: 'Points earned for this answer',
    example: 10,
  })
  @IsOptional()
  @IsInt()
  points?: number;

  @ApiPropertyOptional({
    description: 'Pronunciation score if applicable',
    type: PronunciationScoreDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PronunciationScoreDto)
  pronunciation?: PronunciationScoreDto;
}
