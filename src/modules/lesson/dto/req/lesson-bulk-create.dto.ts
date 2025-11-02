import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, IsArray, ArrayMinSize } from 'class-validator';
import { CreateLessonDto } from './create-lesson.dto';
import { Type } from 'class-transformer';

export class LessonBulkCreateDto {
  @ApiProperty({
    description: 'ID of the topic these lessons belong to',
    example: 1,
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  topicId: number;

  @ApiProperty({
    description: 'Array of lesson data',
    type: [CreateLessonDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => CreateLessonDto)
  lessons: Omit<CreateLessonDto, 'topicId'>[];
}
