import { ApiProperty } from '@nestjs/swagger';
import { TopicResponseDto } from '../res/topic-response.dto';

export class TopicWithRelationsDto extends TopicResponseDto {
  @ApiProperty({ type: [Object] })
  lessons: any[];

  @ApiProperty({ type: [Object] })
  flashcards: any[];

  @ApiProperty({
    type: 'object',
    properties: {
      lessons: { type: 'number' },
      flashcards: { type: 'number' },
    },
  })
  _count: {
    lessons: number;
    flashcards: number;
  };
}
