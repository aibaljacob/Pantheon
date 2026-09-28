import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { resolve, join } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const uploadsDir = resolve(process.cwd(), 'uploads');
  // Statically serve ONLY legitimate public media subdirectories (avatars, banners, portfolio, resumes).
  // Build artifacts, project archives, and private files are NEVER served statically.
  app.use('/uploads/avatars', express.static(join(uploadsDir, 'avatars')));
  app.use('/uploads/banners', express.static(join(uploadsDir, 'banners')));
  app.use('/uploads/portfolio', express.static(join(uploadsDir, 'portfolio')));
  app.use('/uploads/resumes', express.static(join(uploadsDir, 'resumes')));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Pantheon API')
    .setDescription('Pantheon authentication and platform API')
    .setVersion('1.0.0')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
