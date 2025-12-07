import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsInt, Min, IsOptional, IsBoolean } from 'class-validator';
import { CreateFlashcardDto } from './req/create-flashcard.dto';

export class UpdateFlashcardDto extends PartialType(CreateFlashcardDto) {
  @ApiPropertyOptional({
    description: 'Reset learning progress for this flashcard',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  resetProgress?: boolean;
  @ApiPropertyOptional({
    description: 'ID of the topic this flashcard belongs to',
    example: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  topicId?: number;

  @ApiPropertyOptional({
    description: 'English term or word',
    example: 'cat',
  })
  @IsString()
  @IsOptional()
  term?: string;

  @ApiPropertyOptional({
    description: 'Vietnamese meaning',
    example: 'con mèo',
  })
  @IsString()
  @IsOptional()
  meaningVi?: string;
}
