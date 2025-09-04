import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { Transform } from 'class-transformer';

// Create enum locally to avoid Prisma client issues
export enum GradeLevel {
  GRADE_1 = 'GRADE_1',
  GRADE_2 = 'GRADE_2',
  GRADE_3 = 'GRADE_3',
  GRADE_4 = 'GRADE_4',
  GRADE_5 = 'GRADE_5',
}

export class CreateTopicDto {
  @ApiProperty({
    description: 'The title of the topic',
    example: 'Animals and Pets',
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the topic',
    example: 'Learn about different animals and how to take care of pets',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Grade level for this topic',
    enum: GradeLevel,
    example: GradeLevel.GRADE_1,
  })
  @IsEnum(GradeLevel)
  grade: GradeLevel;

  @ApiPropertyOptional({
    description: 'Order of the topic in the curriculum',
    example: 1,
    minimum: 0,
    default: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  order?: number;

  @ApiPropertyOptional({
    description: 'Cover image URL for the topic',
    example: 'https://example.com/images/animals.jpg',
  })
  @IsString()
  @IsOptional()
  coverImage?: string;

  @ApiPropertyOptional({
    description: 'Whether the topic is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;
}

export class UpdateTopicDto extends PartialType(CreateTopicDto) {
  @ApiPropertyOptional({
    description: 'The title of the topic',
    example: 'Animals and Pets',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Grade level for this topic',
    enum: GradeLevel,
    example: GradeLevel.GRADE_1,
  })
  @IsEnum(GradeLevel)
  @IsOptional()
  grade?: GradeLevel;
}

export class TopicResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Animals and Pets' })
  title: string;

  @ApiPropertyOptional({ example: 'Learn about different animals and how to take care of pets' })
  description?: string;

  @ApiProperty({ enum: GradeLevel, example: GradeLevel.GRADE_1 })
  grade: GradeLevel;

  @ApiProperty({ example: 1 })
  order: number;

  @ApiPropertyOptional({ example: 'https://example.com/images/animals.jpg' })
  coverImage?: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class TopicWithRelationsDto extends TopicResponseDto {
  @ApiProperty({ type: [Object] })
  lessons: any[];

  @ApiProperty({ type: [Object] })
  flashcards: any[];

  @ApiProperty({ 
    type: 'object',
    properties: {
      lessons: { type: 'number' },
      flashcards: { type: 'number' }
    }
  })
  _count: {
    lessons: number;
    flashcards: number;
  };
}

export class TopicStatsDto {
  @ApiProperty({ example: 1 })
  topicId: number;

  @ApiProperty({ example: 'Animals and Pets' })
  title: string;

  @ApiProperty({ enum: GradeLevel, example: GradeLevel.GRADE_1 })
  grade: GradeLevel;

  @ApiProperty({ example: 5 })
  totalLessons: number;

  @ApiProperty({ example: 20 })
  totalFlashcards: number;

  @ApiProperty({ example: 15 })
  totalExercises: number;

  @ApiProperty({ example: 100 })
  totalAttempts: number;
}
