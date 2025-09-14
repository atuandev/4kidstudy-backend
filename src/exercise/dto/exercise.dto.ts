import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { 
  IsEnum, 
  IsInt, 
  IsString, 
  IsOptional, 
  IsBoolean, 
  ValidateNested, 
  Min, 
  Max,
  IsArray
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExerciseType } from '@prisma/client';

// Option DTOs
export class CreateOptionDto {
  @ApiPropertyOptional({ description: 'Text content of the option' })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiPropertyOptional({ description: 'URL to image for the option' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'URL to audio for the option' })
  @IsString()
  @IsOptional()
  audioUrl?: string;

  @ApiProperty({ description: 'Whether this option is correct', default: false })
  @IsBoolean()
  isCorrect: boolean = false;

  @ApiPropertyOptional({ description: 'Order/position of this option' })
  @IsInt()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ 
    description: 'For MATCHING type: matching key to link pairs (e.g., "pair_1")' 
  })
  @IsString()
  @IsOptional()
  matchKey?: string;
}

export class UpdateOptionDto extends PartialType(CreateOptionDto) {
  @ApiPropertyOptional({ description: 'Unique identifier for the option (required for updates)' })
  @IsInt()
  @IsOptional()
  id?: number;
}

export class ExerciseOptionDto extends CreateOptionDto {
  @ApiProperty({ description: 'Unique identifier for the option' })
  id: number;

  @ApiProperty({ description: 'ID of the exercise this option belongs to' })
  exerciseId: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

// Exercise DTOs
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

  @ApiPropertyOptional({ description: 'Order/position of this exercise in the lesson' })
  @IsInt()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ description: 'Question text or instructions for the exercise' })
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
    description: 'Target text for pronunciation or expected answer for listening' 
  })
  @IsString()
  @IsOptional()
  targetText?: string;

  @ApiPropertyOptional({ 
    description: 'Points earned for correctly answering this exercise', 
    default: 10 
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  points?: number;

  @ApiPropertyOptional({ 
    description: 'Difficulty level (1-3)', 
    default: 1 
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(3)
  difficulty?: number;

  @ApiPropertyOptional({ type: [CreateOptionDto], description: 'Options for this exercise' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  @IsOptional()
  options?: CreateOptionDto[];
}

export class UpdateExerciseDto extends PartialType(OmitType(CreateExerciseDto, ['options'] as const)) {
  @ApiPropertyOptional({ type: [UpdateOptionDto], description: 'Options to update' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOptionDto)
  @IsOptional()
  options?: UpdateOptionDto[];
}

// Response DTOs
export class ExerciseDto {
  @ApiProperty({ description: 'Unique identifier for the exercise' })
  id: number;

  @ApiProperty({ description: 'ID of the lesson this exercise belongs to' })
  lessonId: number;

  @ApiProperty({
    description: 'Type of exercise',
    enum: ExerciseType,
    enumName: 'ExerciseType',
  })
  type: ExerciseType;

  @ApiProperty({ description: 'Order/position of this exercise in the lesson' })
  order: number;

  @ApiPropertyOptional({ description: 'Question text or instructions for the exercise' })
  prompt?: string;

  @ApiPropertyOptional({ description: 'URL to the image for this exercise' })
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'URL to the audio for this exercise' })
  audioUrl?: string;

  @ApiPropertyOptional({ 
    description: 'Target text for pronunciation or expected answer for listening' 
  })
  targetText?: string;

  @ApiProperty({ description: 'Points earned for correctly answering this exercise' })
  points: number;

  @ApiProperty({ description: 'Difficulty level (1-3)' })
  difficulty: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiProperty({ type: [ExerciseOptionDto], description: 'Options for this exercise' })
  options: ExerciseOptionDto[];
}

// Reorder DTOs
export class ReorderExercisesDto {
  @ApiProperty({ 
    description: 'Ordered array of exercise IDs representing the new order', 
    type: [Number] 
  })
  @IsArray()
  @IsInt({ each: true })
  exerciseIds: number[];
}

export class ReorderOptionsDto {
  @ApiProperty({ 
    description: 'Ordered array of option IDs representing the new order', 
    type: [Number] 
  })
  @IsArray()
  @IsInt({ each: true })
  optionIds: number[];
}
