import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsPositive, Min } from 'class-validator';
import { LessonStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class LessonQueryParamsDto {
  @ApiPropertyOptional({ description: 'Number of items to skip', default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  skip?: number;

  @ApiPropertyOptional({ description: 'Number of items to take', default: 10 })
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  take?: number;

  @ApiPropertyOptional({ description: 'Filter by topic ID' })
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  topicId?: number;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: LessonStatus,
  })
  @IsEnum(LessonStatus)
  @IsOptional()
  status?: string;
}
