import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { WorkShiftDTO, CreateWorkShiftDTO, UpdateWorkShiftDTO } from './Dto/work_shift.dto';
import { User } from 'src/User/Entity/user.entity';
import { UserInfo } from 'src/User/Entity/user_info.entity';
import { WorkShift } from './Entity/work_shift.ts.entity';
import { WorkShiftUser } from './Entity/work_shift_user.entity';


@Injectable()
export class WorkShiftService {

  constructor(
    @InjectRepository(WorkShift)
    private workShiftRepository: Repository<WorkShift>,
    @InjectRepository(WorkShiftUser)
    private workShiftRepositoryUser: Repository<WorkShiftUser>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  /**
  * Получить смены для текущего сотрудника (с фильтрами и пагинацией)
  */
  async listWorkShift(param: WorkShiftDTO, req: any): Promise<{
    shift_id: number,
    call_date_start: string,
    call_date_end: string,
    user_id: number,
    master_user_id: number,
    event_id: number,
    comment: string,
    list_user_id: number[],
    created_at: string,
    updated_at: string,
  }[]> {

    if (!param.page) param.page = 0;
    if (!param.limit_page) param.limit_page = 30;

    const sLimit = `LIMIT ${param.limit_page}`;
    const sOffset = `OFFSET ${param.page * param.limit_page}`;

    // Текущий пользователь — сотрудник, который смотрит свои смены
    const idCurrUser = req?.curr_user ?? 0;
    if (!idCurrUser) {
      throw new HttpException('Вы не авторизованы', HttpStatus.UNAUTHORIZED);
    }

    // Фильтр по дате начала смены
    let sByCallDateStart = '';
    if (param.call_date_start) {
      sByCallDateStart = `AND ws.call_date_start = '${param.call_date_start}'`;
    }

    // Фильтр по event_id
    let sByEventId = '';
    if (param.event_id) {
      sByEventId = `AND ws.event_id = ${param.event_id}`;
    }

    const sql = `
    SELECT ws.id as shift_id,
           ws.call_date_start,
           ws.call_date_end,
           ws.user_id,
           ws.master_user_id,
           ws.event_id,
           ws.comment,
           ws.created_at,
           ws.updated_at,
           COALESCE(json_agg(DISTINCT wsu.user_id) FILTER (WHERE wsu.user_id IS NOT NULL), '[]') as list_user_id
    FROM "work_shift" ws
    INNER JOIN "work_shift_user" wsu ON wsu.work_shift_id = ws.id
    WHERE wsu.user_id = ${idCurrUser}
    ${sByCallDateStart}
    ${sByEventId}
    GROUP BY ws.id
    ORDER BY ws.id ASC
    ${sOffset}
    ${sLimit}
    ;
    `;

    const aShiftData: {
      shift_id: number,
      call_date_start: string,
      call_date_end: string,
      user_id: number,
      master_user_id: number,
      event_id: number,
      comment: string,
      created_at: string,
      updated_at: string,
      list_user_id: string,
    }[] = await this.workShiftRepository.query(sql);

    // Парсим list_user_id из JSON-строки в массив чисел
    return aShiftData.map(row => ({
      ...row,
      list_user_id: Array.isArray(row.list_user_id) ? row.list_user_id : [],
    }));
  }

  /**
   * Создать смену
   */
  async createWorkShift(param: CreateWorkShiftDTO, req: any): Promise<string> {
    const aidUserWorker = param.list_user_id || [];

    if (!aidUserWorker.length) {
      throw new HttpException('Не указаны сотрудники для вызова', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Валидация ID сотрудников
    for (let i = 0; i < aidUserWorker.length; i++) {
      const idUserWorker = aidUserWorker[i];
      if (!idUserWorker || !Number.isInteger(idUserWorker) || idUserWorker <= 0) {
        throw new HttpException('Внутренняя ошибка, некорректные id сотрудников', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }

    const idUser = req?.curr_user ?? 0;

    // Транзакция: создаём смену и сотрудников атомарно
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const vWorkShift = await queryRunner.manager.save(WorkShift, {
        ...param,
        user_id: idUser,
        master_user_id: param.master_user_id ?? idUser,
      });

      if (!vWorkShift?.id) {
        await queryRunner.rollbackTransaction();
        throw new HttpException('Ошибка при создании смены', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const aWorkShiftUserInsert: WorkShiftUser[] = [];
      for (let i = 0; i < aidUserWorker.length; i++) {
        aWorkShiftUserInsert.push({
          user_id: aidUserWorker[i],
          work_shift_id: vWorkShift.id,
        });
      }

      const aWorkShiftUser = await queryRunner.manager.save(WorkShiftUser, aWorkShiftUserInsert);

      if (!aWorkShiftUser?.length) {
        await queryRunner.rollbackTransaction();
        throw new HttpException('Ошибка при привязке сотрудников к смене', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      await queryRunner.commitTransaction();

    } catch (e) {
      if (!queryRunner.isTransactionActive) {
        throw e;
      }
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
    return 'Смена создана';
  }

  /**
   * Обновить смену (в том числе замена сотрудников)
   */
  async updateWorkShift(param: UpdateWorkShiftDTO, req: any): Promise<{ is_ok: boolean, message: string }> {
    const idShift = param.shift_id;
    const idUser = req?.curr_user ?? 0;

    if (!idShift) {
      throw new HttpException('Не указан shift_id смены', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    let isOk = false;
    let sMessage = 'Не удалось обновить информацию о смене';

    // Находим смену
    const vShift = await this.workShiftRepository.findOneBy({ id: idShift });
    if (!vShift) {
      throw new HttpException('Смена не найдена', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Готовим данные для обновления смены
    const updateData: Partial<WorkShift> = {};

    if (param.comment !== undefined) {
      updateData.comment = param.comment;
    }
    if (param.master_user_id !== undefined) {
      updateData.master_user_id = param.master_user_id;
    }
    if (param.event_id) {
      updateData.event_id = param.event_id;
    }
    if (param.call_date_start) {
      updateData.call_date_start = param.call_date_start;
    }
    if (param.call_date_end) {
      updateData.call_date_end = param.call_date_end;
    }

    // Обновляем данные смены
    if (Object.keys(updateData).length > 0) {
      updateData.user_id = idUser;
      await this.workShiftRepository.update(idShift, updateData);
    }

    // Заменяем сотрудников, если указан list_user_id
    if (param.list_user_id && param.list_user_id.length > 0) {
      // Удаляем старые записи сотрудников
      await this.workShiftRepositoryUser.delete({ work_shift_id: idShift });

      // Создаём новые записи
      const aWorkShiftUserInsert: WorkShiftUser[] = [];
      for (let i = 0; i < param.list_user_id.length; i++) {
        const workerId = param.list_user_id[i];
        if (workerId && Number(workerId) && Number.isInteger(workerId) && workerId > 0) {
          aWorkShiftUserInsert.push({
            user_id: workerId,
            work_shift_id: idShift,
          });
        }
      }

      if (aWorkShiftUserInsert.length > 0) {
        await this.workShiftRepositoryUser.save(aWorkShiftUserInsert);
      }
    }

    isOk = true;
    sMessage = 'Информация обновлена';

    return { is_ok: isOk, message: sMessage };
  }
}
