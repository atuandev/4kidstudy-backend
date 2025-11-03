import {
  IsInt,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PronunciationScoreDto } from './submit-exercise.dto';

/**
 * DTO for creating an attempt detail record
 */
export class CreateAttemptDetailDto {
  @ApiProperty({
    description: 'Attempt ID',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  attemptId: number;

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
    description: 'Maximum points possible',
    example: 10,
  })
  @IsOptional()
  @IsInt()
  maxPoints?: number;

  @ApiPropertyOptional({
    description: 'Number of attempts made',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  attempts?: number;

  @ApiPropertyOptional({
    description: 'Pronunciation score if applicable',
    type: PronunciationScoreDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PronunciationScoreDto)
  pronunciation?: PronunciationScoreDto;
}
