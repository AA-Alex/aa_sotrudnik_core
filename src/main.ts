import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  await app.listen(4000);

}

bootstrap();

export default class ContextClass {

  private ctx: any;

  constructor() {
    this.ctx = {
      user_id: 0
    }
  }
}
