import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class FlashcardItemDto {
  @ApiProperty({
    description: 'English term or word',
    example: 'cat',
  })
  @IsString()
  term: string;

  @ApiProperty({
    description: 'Phonetic pronunciation',
    example: '/kæt/',
  })
  @IsString()
  phonetic: string;

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
