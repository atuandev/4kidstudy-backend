import { PartialType } from '@nestjs/swagger';
import { CreateSentenceDto } from './req/create-sentence.dto';

export class UpdateSentenceDto extends PartialType(CreateSentenceDto) {}
