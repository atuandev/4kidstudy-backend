import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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