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

export class CreateSentenceImageDto {
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
}
