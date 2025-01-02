import { Controller, Post, Body, ValidationPipe, Req, HttpCode } from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto, ListEventDto, UpdateEventDto } from './Dto/event.dto';

@Controller('event')
export class EventController {
  constructor(
    private readonly eventService: EventService,

  ) {}

  /**
   * Получить события (с фильтром и пагинацией)
   */
  @Post('list-event')
  @HttpCode(200)
  async register(@Req() request: Request, @Body(new ValidationPipe({ skipMissingProperties: true, whitelist: true })) data: ListEventDto,): Promise<{
    event_id: number,
    event_name: string,
    user_id: number,
    created_at: string,
    updated_at: string,
  }[]> {

    return await this.eventService.listEvent(data);
  }

  /**
  * Создать событие
  */
  @Post('create-event')
  @HttpCode(200)
  async createEvent(@Req() request: Request, @Body(new ValidationPipe({ skipMissingProperties: true, whitelist: true })) data: CreateEventDto,): Promise<string> {

    return await this.eventService.createEvent(data, request.body);
  }

  /**
  * Обновить событие
  */
  @Post('update-event')
  @HttpCode(200)
  async updateUserByAdmin(@Req() request: Request, @Body(
    new ValidationPipe({ skipMissingProperties: true, whitelist: true })
  ) data: UpdateEventDto,): Promise<{ is_ok: boolean, message: string }> {

    return await this.eventService.updateEvent(data, request.body);
  }


}
