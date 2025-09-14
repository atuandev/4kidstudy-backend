import { ApiProperty } from '@nestjs/swagger';
import { FlashcardResponseDto } from '../res/flashcard-response.dto';

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