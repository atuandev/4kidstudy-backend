import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://4kidstudy-frontend.vercel.app',
      'https://4kidstudy-frontend-git-dev2-atuandev-projects.vercel.app',
      'https://4kidstudy-frontend-git-dev-atuandev-projects.vercel.app',
    ].filter(Boolean),
    credentials: true,
  });

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('4KidStudy API')
    .setDescription('API documentation for 4KidStudy learning platform')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('topics', 'Topic management endpoints')
    .addTag('flashcards', 'Flashcard management endpoints')
    .addTag('lessons', 'Lesson management endpoints')
    .addTag('exercises', 'Exercise management endpoints')
    .addTag('users', 'User management endpoints')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app as any, config);
  SwaggerModule.setup('api/docs', app as any, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 3001);
  const port = process.env.PORT ?? 3001;
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(
    `Swagger documentation available at: http://localhost:${port}/api/docs`,
  );
}
bootstrap();
