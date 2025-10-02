import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  IsInt,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateSentenceWithoutImageIdDto {
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

export class CreateSentenceImageWithSentencesDto {
  @ApiProperty({
    description: 'ID of the topic this sentence image belongs to',
    example: 1,
  })
  @IsInt()
  @Min(1)
  topicId: number;

  @ApiProperty({
    description: 'Image URL for the sentence scene',
    example: 'https://example.com/images/scene.jpg',
  })
  @IsString()
  imageUrl: string;

  @ApiPropertyOptional({
    description: 'Audio URL for the sentence scene',
    example: 'https://example.com/audio/scene.mp3',
  })
  @IsString()
  @IsOptional()
  audioUrl?: string;

  @ApiPropertyOptional({
    description: 'Order of the sentence image within the topic',
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
    description: 'Whether the sentence image is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiProperty({
    description: 'Array of sentences for this image',
    type: [CreateSentenceWithoutImageIdDto],
    example: [
      {
        text: 'The cat is sleeping.',
        meaningVi: 'Con mèo đang ngủ.',
        order: 0,
      },
      {
        text: 'The dog is playing.',
        meaningVi: 'Con chó đang chơi.',
        order: 1,
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one sentence is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateSentenceWithoutImageIdDto)
  sentences: CreateSentenceWithoutImageIdDto[];
}
