import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  IsInt,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateFlashcardDto {
  @ApiProperty({
    description: 'ID of the topic this flashcard belongs to',
    example: 1,
  })
  @IsInt()
  @Min(1)
  topicId: number;

  @ApiProperty({
    description: 'English term or word',
    example: 'cat',
  })
  @IsString()
  term: string;

  @ApiPropertyOptional({
    description: 'Phonetic pronunciation',
    example: '/kæt/',
  })
  @IsString()
  @IsOptional()
  phonetic?: string;

  @ApiProperty({
    description: 'Vietnamese meaning',
    example: 'con mèo',
  })
  @IsString()
  meaningVi: string;

  @ApiPropertyOptional({
    description: 'Example sentence in English',
    example: 'The cat is sleeping on the sofa.',
  })
  @IsString()
  @IsOptional()
  exampleEn?: string;

  @ApiPropertyOptional({
    description: 'Example sentence in Vietnamese',
    example: 'Con mèo đang ngủ trên ghế sofa.',
  })
  @IsString()
  @IsOptional()
  exampleVi?: string;

  @ApiPropertyOptional({
    description: 'Image URL for the flashcard',
    example: 'https://example.com/images/cat.jpg',
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Audio URL for pronunciation',
    example: 'https://example.com/audio/cat.mp3',
  })
  @IsString()
  @IsOptional()
  audioUrl?: string;

  @ApiPropertyOptional({
    description: 'Order of the flashcard within the topic',
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
    description: 'Whether the flashcard is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;
}

export class UpdateFlashcardDto extends PartialType(CreateFlashcardDto) {
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

export class FlashcardResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  topicId: number;

  @ApiProperty({ example: 'cat' })
  term: string;

  @ApiPropertyOptional({ example: '/kæt/' })
  phonetic?: string;

  @ApiProperty({ example: 'con mèo' })
  meaningVi: string;

  @ApiPropertyOptional({ example: 'The cat is sleeping on the sofa.' })
  exampleEn?: string;

  @ApiPropertyOptional({ example: 'Con mèo đang ngủ trên ghế sofa.' })
  exampleVi?: string;

  @ApiPropertyOptional({ example: 'https://example.com/images/cat.jpg' })
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/audio/cat.mp3' })
  audioUrl?: string;

  @ApiProperty({ example: 1 })
  order: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class FlashcardWithTopicDto extends FlashcardResponseDto {
  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'number' },
      title: { type: 'string' },
      grade: { type: 'string' },
    },
  })
  topic: {
    id: number;
    title: string;
    grade: string;
  };
}

export class FlashcardBulkCreateDto {
  @ApiProperty({
    description: 'ID of the topic these flashcards belong to',
    example: 1,
  })
  @IsInt()
  @Min(1)
  topicId: number;

  @ApiProperty({
    description: 'Array of flashcard data',
    type: [CreateFlashcardDto],
  })
  flashcards: Omit<CreateFlashcardDto, 'topicId'>[];
}
