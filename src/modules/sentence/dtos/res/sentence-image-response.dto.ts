import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SentenceResponseDto } from './sentence-response.dto';
import { TopicResponseDto } from '../../topic/dtos/res/topic-response.dto';

export class SentenceImageResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  topicId: number;

  @ApiProperty({ example: 'https://example.com/images/scene.jpg' })
  imageUrl: string;

  @ApiPropertyOptional({ example: 'https://example.com/audio/scene.mp3' })
  audioUrl?: string;

  @ApiProperty({ example: 0 })
  order: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [SentenceResponseDto] })
  sentences: SentenceResponseDto[];

  @ApiProperty({ type: TopicResponseDto })
  topic: TopicResponseDto;
}

