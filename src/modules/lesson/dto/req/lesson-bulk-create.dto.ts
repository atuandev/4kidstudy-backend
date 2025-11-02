import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { LessonItemDto } from './lesson-item.dto';
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
    type: [LessonItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LessonItemDto)
  lessons: LessonItemDto[];
}
