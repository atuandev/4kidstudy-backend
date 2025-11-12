import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { TopicModule } from './modules/topic/topic.module';
import { FlashcardModule } from './modules/flashcard/flashcard.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { LessonModule } from './modules/lesson/lesson.module';
import { ExerciseModule } from './modules/exercise/exercise.module';
import { SentenceModule } from './modules/sentence/sentence.module';
import { AttemptModule } from './modules/attempt/attempt.module';
import { LearningProgressModule } from './modules/learning-progress/learning-progress.module';
import { PronunciationModule } from './modules/pronunciation/pronunciation.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    TopicModule,
    FlashcardModule,
    AuthModule,
    UserModule,
    LessonModule,
    ExerciseModule,
    SentenceModule,
    AttemptModule,
    LearningProgressModule,
    PronunciationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
