import { Module } from '@nestjs/common';
import { SentenceController } from './sentence.controller';
import { SentenceService } from './sentence.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SentenceController],
  providers: [SentenceService],
  exports: [SentenceService],
})
export class SentenceModule {}

