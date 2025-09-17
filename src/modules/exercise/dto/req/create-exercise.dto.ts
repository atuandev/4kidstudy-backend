import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsString,
  IsOptional,
  ValidateNested,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExerciseType } from '@prisma/client';
import { CreateOptionDto } from './create-option.dto';

export class CreateExerciseDto {
  @ApiProperty({ description: 'ID of the lesson this exercise belongs to' })
  @IsInt()
  lessonId: number;

  @ApiProperty({
    description: 'Type of exercise',
    enum: ExerciseType,
    enumName: 'ExerciseType',
  })
  @IsEnum(ExerciseType)
  type: ExerciseType;

  @ApiPropertyOptional({
    description: 'Order/position of this exercise in the lesson',
  })
  @IsInt()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({
    description: 'Question text or instructions for the exercise',
  })
  @IsString()
  @IsOptional()
  prompt?: string;

  @ApiPropertyOptional({ description: 'URL to the image for this exercise' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'URL to the audio for this exercise' })
  @IsString()
  @IsOptional()
  audioUrl?: string;

  @ApiPropertyOptional({
    description:
      'Target text for pronunciation or expected answer for listening',
  })
  @IsString()
  @IsOptional()
  targetText?: string;

  @ApiPropertyOptional({
    description: 'Points earned for correctly answering this exercise',
    default: 10,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  points?: number;

  @ApiPropertyOptional({
    description: 'Difficulty level (1-3)',
    default: 1,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(3)
  difficulty?: number;

  @ApiPropertyOptional({
    type: [CreateOptionDto],
    description: 'Options for this exercise',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  @IsOptional()
  options?: CreateOptionDto[];
}
