import { Module } from '@nestjs/common';
import { PronunciationController } from './pronunciation.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PronunciationService } from './pronunciation.service';

@Module({
  imports: [PrismaModule],
  controllers: [PronunciationController],
  providers: [PronunciationService],
  exports: [PronunciationService],
})
export class PronunciationModule {}
