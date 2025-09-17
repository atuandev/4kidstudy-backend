import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { CreateTopicDto, GradeLevel } from './create-topic.dto';

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
