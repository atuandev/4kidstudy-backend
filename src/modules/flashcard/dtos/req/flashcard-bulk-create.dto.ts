import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { CreateFlashcardDto } from './create-flashcard.dto';

export class FlashcardBulkCreateDto {
  @ApiProperty({
    description: 'ID of the topic these flashcards belong to',
    example: 1,
  })
  @IsInt()
  @Min(1)
  topicId: number;

  @ApiProperty({
    description: 'Array of flashcard data',
    type: [CreateFlashcardDto],
  })
  flashcards: Omit<CreateFlashcardDto, 'topicId'>[];
}