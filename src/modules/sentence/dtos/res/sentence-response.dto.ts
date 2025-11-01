import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SentenceResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  sentenceImageId: number;

  @ApiProperty({ example: 'The cat is sleeping.' })
  text: string;

  @ApiPropertyOptional({ example: 'Con mèo đang ngủ.' })
  meaningVi?: string;

  @ApiPropertyOptional({ example: 'Gợi ý: sleeping = đang ngủ' })
  hintVi?: string;

  @ApiPropertyOptional({ example: 'https://example.com/audio/sentence.mp3' })
  audioUrl?: string;

  @ApiProperty({ example: 0 })
  order: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
