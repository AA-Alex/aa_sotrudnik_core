import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { core } from './Config/Config'

/**
 * Интерфейс для пагинации
 */

export interface PaginationI {
  curr_page: number;  // Текущая страница
  total: number;      // Всего на страницу
  page_total: number; // Всего страниц
  page_limit: number; // Всего количество на странице
}


async function start() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  await app.listen(core.port, () => console.log(`Server started on port = ${core.port}`));
}

start();
