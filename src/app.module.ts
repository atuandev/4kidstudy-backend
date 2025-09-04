import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { TopicModule } from './topic/topic.module';

@Module({
  imports: [PrismaModule, TopicModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
