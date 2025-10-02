import { PartialType } from '@nestjs/swagger';
import { CreateSentenceImageDto } from './req/create-sentence-image.dto';

export class UpdateSentenceImageDto extends PartialType(
  CreateSentenceImageDto,
) {}
