import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEventDto, ListEventDto, UpdateEventDto } from './Dto/event.dto';
import { Event } from 'src/Event/Entity/event.entity';
import { User } from 'src/User/Entity/user.entity';
import { UserInfo } from 'src/User/Entity/user_info.entity';


@Injectable()
export class EventService {

  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserInfo)
    private userInfoRepository: Repository<UserInfo>,

  ) {}

  /**
  * Получить события
  */
  async listEvent(param: ListEventDto): Promise<{
    event_id: number,
    event_name: string,
    user_id: number,
    created_at: string,
    updated_at: string,
  }[]> {

    if (!param.page) param.page = 0;
    if (!param.limit_page) param.limit_page = 30;

    const sLimit = `LIMIT ${param.limit_page}`;
    const sOffset = `OFFSET ${param.page * param.limit_page}`;

    let sByEventName = 'WHERE t.event_name IS NOT NULL';
    if (param.event_name) {
      sByEventName = `WHERE t.event_name like('%${param.event_name}%')`;
    }

    let sByUserId = '';
    if (param.user_id) {
      sByUserId = `AND t.user_id = ${param.user_id}`;
    }

    const sql = `
    SELECT t.*
    FROM "event" t
    ${sByEventName}
    ${sByUserId}
    ORDER BY t.id ASC
    ${sOffset}
    ${sLimit}
    ;
    `;

    const aEventData: {
      event_id: number,
      event_name: string,
      user_id: number,
      created_at: string,
      updated_at: string,
    }[] = await this.eventRepository.query(sql);

    return aEventData;
  }

  /**
 * Создать событие
 */
  async createEvent(param: CreateEventDto): Promise<string> {
    param.event_name = param.event_name.toLowerCase();
    let sResponse = '';
    const idUser = param?.curr_user ?? 0;

    let vExistEvent = await this.eventRepository.findOneBy({ event_name: param.event_name });
    if (vExistEvent) {
      throw new HttpException('Событие с таким названием уже существует', HttpStatus.FORBIDDEN);

    } else {
      const vEvent = await this.eventRepository.save({ ...param, user_id: idUser });

      if (vEvent?.id) {
        sResponse = 'Событие создано';
      } else {
        throw new HttpException('Ошибка при создании события', HttpStatus.INTERNAL_SERVER_ERROR);

      }
    }

    return sResponse;
  }

  /**
   * Обновить событие
   */
  async updateEvent(param: UpdateEventDto): Promise<{ is_ok: boolean, message: string }> {
    const idEvent = param.event_id;
    const idUser = param?.curr_user ?? 0;

    if (!idEvent) {
      throw new HttpException('Не указан id события', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    let isOk = false;
    let sMessage = 'Не удалось обновить информацию о событии';

    const vEvent = await this.eventRepository.findOneBy({ id: idEvent });
    if (!vEvent) {
      throw new HttpException('Не удалось найти событие по id', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (param.event_name) {
      param.event_name = param.event_name.toLowerCase();

      let vExistEvent = await this.eventRepository.findOneBy({ event_name: param.event_name });

      if (!vExistEvent || (vExistEvent.event_name && param.event_name === vExistEvent.event_name)) {
        isOk = true;
      } else {
        throw new HttpException(`Событие с названием ${param.event_name} уже существует`, HttpStatus.FORBIDDEN);
      }

    }

    if (isOk) {
      await this.eventRepository.update(idEvent, { event_name: param.event_name, user_id: idUser });
      isOk = true;
      sMessage = 'Информация обновлена';
    }

    return { is_ok: isOk, message: sMessage };
  }
}
