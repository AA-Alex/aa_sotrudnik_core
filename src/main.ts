import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { core } from './Config/Config'

async function start() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  await app.listen(core.port, () => console.log(`Server started on port = ${core.port}`));
}

start();

export const ctx = {
  userSys: {
    user_id: 0
  }
}
