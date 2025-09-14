import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GradeLevel } from '../req/create-topic.dto';

export class TopicResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Animals and Pets' })
  title: string;

  @ApiPropertyOptional({
    example: 'Learn about different animals and how to take care of pets',
  })
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