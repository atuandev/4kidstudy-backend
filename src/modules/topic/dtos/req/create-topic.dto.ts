import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
} from 'class-validator';
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
  @Transform(({ value }) => Number.parseInt(String(value), 10))
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