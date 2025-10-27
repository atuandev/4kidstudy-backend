import { Module } from '@nestjs/common';
import { AttemptController } from './attempt.controller';
import { AttemptService } from './attempt.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Module for handling lesson attempts and exercise submissions
 */
@Module({
  imports: [PrismaModule],
  controllers: [AttemptController],
  providers: [AttemptService],
  exports: [AttemptService],
})
export class AttemptModule {}
