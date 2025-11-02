import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, IsArray, ArrayMinSize } from 'class-validator';
import { CreateSentenceImageWithSentencesDto } from './sentence-image-with-sentences.dto';
import { Type } from 'class-transformer';

export class SentenceBulkCreateDto {
  @ApiProperty({
    description: 'ID of the topic these sentence images belong to',
    example: 1,
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  topicId: number;

  @ApiProperty({
    description: 'Array of sentence image data with their sentences',
    type: [CreateSentenceImageWithSentencesDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => CreateSentenceImageWithSentencesDto)
  sentenceImages: Omit<CreateSentenceImageWithSentencesDto, 'topicId'>[];
}
