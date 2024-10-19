import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Injectable } from '@nestjs/common';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  await app.listen(4000);

}

bootstrap();

export const ctx = {
  userSys: {
    user_id: 0
  }
}
