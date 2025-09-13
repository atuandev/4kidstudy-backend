import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { TopicModule } from './modules/topic/topic.module';
import { FlashcardModule } from './modules/flashcard/flashcard.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, TopicModule, FlashcardModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
