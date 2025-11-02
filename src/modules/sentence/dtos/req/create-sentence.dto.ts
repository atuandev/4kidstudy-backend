import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  IsInt,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateSentenceDto {
  @ApiProperty({
    description: 'ID of the sentence image this sentence belongs to',
    example: 1,
  })
  @IsInt()
  @Min(1)
  sentenceImageId: number;

  @ApiProperty({
    description: 'English sentence text',
    example: 'The cat is sleeping.',
  })
  @IsString()
  text: string;

  @ApiPropertyOptional({
    description: 'Vietnamese meaning',
    example: 'Con mèo đang ngủ.',
  })
  @IsString()
  @IsOptional()
  meaningVi?: string;

  @ApiPropertyOptional({
    description: 'Vietnamese hint',
    example: 'Gợi ý: sleeping = đang ngủ',
  })
  @IsString()
  @IsOptional()
  hintVi?: string;

  @ApiPropertyOptional({
    description: 'Audio URL for pronunciation',
    example: 'https://example.com/audio/sentence.mp3',
  })
  @IsString()
  @IsOptional()
  audioUrl?: string;

  @ApiPropertyOptional({
    description: 'Order of the sentence within the sentence image',
    example: 0,
    minimum: 0,
    default: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(String(value), 10))
  order?: number;

  @ApiPropertyOptional({
    description: 'Whether the sentence is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;
}
