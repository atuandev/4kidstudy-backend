import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';
import { CreateSentenceDto } from './req/create-sentence.dto';

export class UpdateSentenceDto extends PartialType(CreateSentenceDto) {
  @IsOptional()
  @IsBoolean()
  resetProgress?: boolean;
}
