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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
