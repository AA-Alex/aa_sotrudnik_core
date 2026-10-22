import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { WorkShiftDTO, CreateWorkShiftDTO, SuggestShiftUserDto, UpdateWorkShiftDTO } from './Dto/work_shift.dto';
import { WorkShiftStatus } from './Entity/work_shift.ts.entity';
import { PaginationI } from 'src/main';
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
   * Сначала ищем сотрудников по началу фамилии, имени или псевдонима.
   */
  private async findUserIdsByNamePrefix(search: string, accessLvl?: number): Promise<number[]> {
    const escaped = search.trim().replace(/[\\%_]/g, '\\$&');
    const values: Array<string | number> = [`${escaped}%`];
    let roleSql = '';
    if (Number.isInteger(accessLvl) && accessLvl > 0) {
      values.push(accessLvl);
      roleSql = `AND u.access_lvl = $${values.length}`;
    }

    const rows: { id: number }[] = await this.userRepository.query(
      `SELECT u.id
       FROM "user" u
       LEFT JOIN user_info ui ON ui.user_id = u.id
       WHERE u.access_lvl >= 1
         AND (
           COALESCE(ui.surname, '') ILIKE $1 ESCAPE '\\'
           OR COALESCE(ui.name, '') ILIKE $1 ESCAPE '\\'
           OR COALESCE(ui.display_name, '') ILIKE $1 ESCAPE '\\'
         )
         ${roleSql}`,
      values,
    );

    return rows.map((row) => Number(row.id)).filter((id) => Number.isInteger(id) && id > 0);
  }

  /**
   * Подсказки для поля «Сотрудник».
   * Доступны всем, кто может открыть список смен.
   */
  async suggestShiftUsers(param: SuggestShiftUserDto, req: any): Promise<{ id: number, label: string }[]> {
    const search = param?.search?.trim() || '';
    if (search.length < 3) {
      return [];
    }

    const idCurrUser = Number(req?.curr_user) || 0;
    if (!idCurrUser) {
      throw new HttpException('Вы не авторизованы', HttpStatus.UNAUTHORIZED);
    }
    const currentUser = await this.userRepository.findOneBy({ id: idCurrUser });
    if (!currentUser) {
      throw new HttpException('Вы не авторизованы', HttpStatus.UNAUTHORIZED);
    }

    const escaped = search.replace(/[\\%_]/g, '\\$&');
    const values: Array<string | number> = [`${escaped}%`];
    let roleSql = '';
    if (Number.isInteger(param.access_lvl) && param.access_lvl > 0) {
      values.push(param.access_lvl);
      roleSql = `AND u.access_lvl = $${values.length}`;
    }

    const rows: {
      id: number,
      surname: string,
      name: string,
      display_name: string,
      login: string,
    }[] = await this.userRepository.query(
      `SELECT u.id,
              COALESCE(ui.surname, '') AS surname,
              COALESCE(ui.name, '') AS name,
              COALESCE(ui.display_name, '') AS display_name,
              u.login
       FROM "user" u
       LEFT JOIN user_info ui ON ui.user_id = u.id
       WHERE u.access_lvl >= 1
         AND (
           COALESCE(ui.surname, '') ILIKE $1 ESCAPE '\\'
           OR COALESCE(ui.name, '') ILIKE $1 ESCAPE '\\'
           OR COALESCE(ui.display_name, '') ILIKE $1 ESCAPE '\\'
         )
         ${roleSql}
       ORDER BY ui.surname ASC, ui.display_name ASC
       LIMIT 20`,
      values,
    );

    return rows.map((row) => {
      const person = [row.surname, row.name].filter(Boolean).join(' ').trim();
      const displayName = row.display_name || row.login;
      const label = person && displayName && person.toLowerCase() !== displayName.toLowerCase()
        ? `${person} · ${displayName}`
        : (person || displayName);
      return { id: Number(row.id), label };
    });
  }

  /**
  * Получить действующие смены (с фильтрами и пагинацией).
  * Список и фильтры доступны всем авторизованным.
  * Редактирование остаётся только у бригадира и выше.
  */
  async listWorkShift(param: WorkShiftDTO, req: any): Promise<{
    list_work_shift: {
      shift_id: number,
      call_date_start: string,
      call_date_end: string,
      user_id: number,
      master_user_id: number,
      status: WorkShiftStatus,
      event_id: number,
      event_name: string,
      comment: string,
      list_user_id: number[],
    }[],
    pagination: PaginationI,
  }> {
    const idCurrUser = Number(req?.curr_user) || 0;
    if (!idCurrUser) {
      throw new HttpException('Вы не авторизованы', HttpStatus.UNAUTHORIZED);
    }

    const currentUser = await this.userRepository.findOneBy({ id: idCurrUser });
    if (!currentUser) {
      throw new HttpException('Вы не авторизованы', HttpStatus.UNAUTHORIZED);
    }

    const page = Number.isInteger(param.page) && param.page >= 0 ? param.page : 0;
    const limit = Number.isInteger(param.limit_page) && param.limit_page > 0
      ? Math.min(param.limit_page, 30)
      : 30;
    const empty = {
      list_work_shift: [],
      pagination: { curr_page: page, page_limit: limit, total: 0, page_total: 0 },
    };

    const searchUser = param.search_user?.trim() || '';
    if (searchUser && searchUser.length < 3) {
      throw new HttpException('Для поиска сотрудника введите не меньше 3 символов', HttpStatus.BAD_REQUEST);
    }

    let userIds: number[] | null = null;
    if (Number.isInteger(param.user_id) && param.user_id > 0) {
      userIds = [param.user_id];
    } else if (searchUser) {
      userIds = await this.findUserIdsByNamePrefix(searchUser, param.access_lvl);
      if (!userIds.length) {
        return empty;
      }
    }

    const where: string[] = ['ws.status != $1'];
    const values: Array<string | number | number[]> = [WorkShiftStatus.disable];

    if (userIds) {
      values.push(userIds);
      where.push(`EXISTS (
        SELECT 1 FROM work_shift_user called
        WHERE called.work_shift_id = ws.id AND called.user_id = ANY($${values.length}::int[])
      )`);
    }
    if (!searchUser && Number.isInteger(param.access_lvl) && param.access_lvl > 0) {
      values.push(param.access_lvl);
      where.push(`EXISTS (
        SELECT 1 FROM work_shift_user called
        JOIN "user" cu ON cu.id = called.user_id
        WHERE called.work_shift_id = ws.id AND cu.access_lvl = $${values.length}
      )`);
    }

    const searchEvent = param.search_event?.trim() || '';
    if (searchEvent) {
      values.push(`${searchEvent.replace(/[\\%_]/g, '\\$&')}%`);
      where.push(`COALESCE(e.event_name, '') ILIKE $${values.length} ESCAPE '\\'`);
    }

    const sortColumns: Record<string, string> = {
      created_at: 'ws.created_at',
      event_name: 'e.event_name',
      access_lvl: `(SELECT MAX(su.access_lvl) FROM work_shift_user sw JOIN "user" su ON su.id = sw.user_id WHERE sw.work_shift_id = ws.id)`,
    };
    const sortExpr = sortColumns[param.sort] || 'ws.created_at';
    const direction = param.sort_desc === false ? 'ASC' : 'DESC';
    const whereSql = where.join(' AND ');
    const fromSql = 'FROM "work_shift" ws LEFT JOIN "event" e ON e.id = ws.event_id';

    const countRows: { total: number }[] = await this.workShiftRepository.query(
      `SELECT COUNT(*)::int AS total ${fromSql} WHERE ${whereSql}`,
      values,
    );
    const total = Number(countRows[0]?.total) || 0;

    const rows: {
      shift_id: number,
      call_date_start: string,
      call_date_end: string,
      user_id: number,
      master_user_id: number,
      status: WorkShiftStatus,
      event_id: number,
      event_name: string,
      comment: string,
      list_user_id: number[] | string,
    }[] = await this.workShiftRepository.query(
      `SELECT ws.id as shift_id,
              ws.call_date_start,
              ws.call_date_end,
              ws.user_id,
              ws.master_user_id,
              ws.status,
              ws.event_id,
              e.event_name,
              ws.comment,
              COALESCE(json_agg(DISTINCT wsu.user_id) FILTER (WHERE wsu.user_id IS NOT NULL), '[]') as list_user_id
       ${fromSql}
       LEFT JOIN work_shift_user wsu ON wsu.work_shift_id = ws.id
       WHERE ${whereSql}
       GROUP BY ws.id, e.event_name
       ORDER BY ${sortExpr} ${direction}, ws.id DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, page * limit],
    );

    return {
      list_work_shift: rows.map((row) => ({
        ...row,
        list_user_id: Array.isArray(row.list_user_id)
          ? row.list_user_id.map((id) => Number(id)).filter((id) => id > 0)
          : [],
      })),
      pagination: {
        curr_page: page,
        page_limit: limit,
        total,
        page_total: total ? Math.ceil(total / limit) : 0,
      },
    };
  }

  /**
   * Создать смену
   */
  async createWorkShift(param: CreateWorkShiftDTO, req: any): Promise<string> {
    const aidUserWorker = param.list_user_id || [];

    if (!aidUserWorker.length) {
      throw new HttpException('Не указаны сотрудники для вызова', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Проверка на дубликаты сотрудников
    const uniqueUsers = new Set(aidUserWorker);
    if (uniqueUsers.size !== aidUserWorker.length) {
      throw new HttpException('Нельзя вызвать одного сотрудника несколько раз', HttpStatus.FORBIDDEN);
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

    if (param.comment) {
      updateData.comment = param.comment;
    }

    updateData.master_user_id = param.master_user_id || idUser;

    if (param.event_id) {
      updateData.event_id = param.event_id;
    }
    if (param.call_date_start) {
      updateData.call_date_start = param.call_date_start;
    }
    if (param.call_date_end) {
      updateData.call_date_end = param.call_date_end;
    }
    if (param.status) {
      updateData.status = param.status;
    }

    // Обновляем данные смены
    if (Object.keys(updateData).length > 0) {
      updateData.user_id = idUser;
      await this.workShiftRepository.update(idShift, updateData);
    }

    // Заменяем сотрудников, если указан list_user_id
    if (param.list_user_id && param.list_user_id.length > 0) {
      // Проверка на дубликаты сотрудников
      const uniqueUsers = new Set(param.list_user_id);
      if (uniqueUsers.size !== param.list_user_id.length) {
        throw new HttpException('Нельзя вызвать одного сотрудника несколько раз', HttpStatus.FORBIDDEN);
      }

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
