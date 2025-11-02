import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FlashcardItemDto } from './flashcard-item.dto';

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
    type: [FlashcardItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FlashcardItemDto)
  flashcards: FlashcardItemDto[];
}
