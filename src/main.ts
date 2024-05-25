import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './_config/winston.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: '*',
    },
    logger: WinstonModule.createLogger(winstonConfig),
  });
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(8000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
