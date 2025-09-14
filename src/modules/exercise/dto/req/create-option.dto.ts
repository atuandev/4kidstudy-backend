import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsInt } from 'class-validator';

export class CreateOptionDto {
  @ApiPropertyOptional({ description: 'Text content of the option' })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiPropertyOptional({ description: 'URL to image for the option' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'URL to audio for the option' })
  @IsString()
  @IsOptional()
  audioUrl?: string;

  @ApiProperty({ description: 'Whether this option is correct', default: false })
  @IsBoolean()
  isCorrect: boolean = false;

  @ApiPropertyOptional({ description: 'Order/position of this option' })
  @IsInt()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ 
    description: 'For MATCHING type: matching key to link pairs (e.g., "pair_1")' 
  })
  @IsString()
  @IsOptional()
  matchKey?: string;
}