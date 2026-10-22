import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationI } from 'src/main';
import { FineAndBonus } from './Entity/fine_and_bonus.entity';
import { FineBonusType } from './Entity/fine_bonus_type';
import { UserFineBonus } from './Entity/user_fine_bonus.entity';
import {
  CreateFineBonusDto,
  CreateUserFineBonusDto,
  ListFineBonusDto,
  ListUserFineBonusDto,
  UpdateFineBonusDto,
  UpdateUserFineBonusDto,
} from './Dto/fine_bonus.dto';

@Injectable()
export class FineBonusService {
  constructor(
    @InjectRepository(FineAndBonus)
    private fineBonusRepository: Repository<FineAndBonus>,
    @InjectRepository(UserFineBonus)
    private userFineBonusRepository: Repository<UserFineBonus>,
  ) {}

  async listFineBonus(param: ListFineBonusDto): Promise<{
    list_fine_bonus: {
      id: number,
      name: string,
      type: FineBonusType,
      created_at: string,
      updated_at: string,
    }[],
    pagination: PaginationI,
  }> {
    const page = Number.isInteger(param?.page) && param.page >= 0 ? param.page : 0;
    const limit = Number.isInteger(param?.limit_page) && param.limit_page > 0
      ? Math.min(param.limit_page, 30)
      : 30;
    const values: Array<string | number> = [];
    const where: string[] = [];

    const search = param?.name?.trim();
    if (search) {
      const escaped = search.replace(/[\\%_]/g, '\\$&');
      values.push(`%${escaped}%`);
      where.push(`name ILIKE $${values.length} ESCAPE '\\'`);
    }
    if (param?.type === FineBonusType.fine || param?.type === FineBonusType.bonus) {
      values.push(param.type);
      where.push(`type = $${values.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const countRows: { total: number }[] = await this.fineBonusRepository.query(
      `SELECT COUNT(*)::int AS total FROM fine_and_bonus ${whereSql}`,
      values,
    );
    const total = Number(countRows[0]?.total) || 0;
    const list_fine_bonus = await this.fineBonusRepository.query(
      `SELECT id, name, type, created_at, updated_at
       FROM fine_and_bonus
       ${whereSql}
       ORDER BY id ASC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, page * limit],
    );

    return {
      list_fine_bonus,
      pagination: {
        curr_page: page,
        page_limit: limit,
        total,
        page_total: total ? Math.ceil(total / limit) : 0,
      },
    };
  }

  async listAllFineBonus(): Promise<{ id: number, name: string, type: FineBonusType }[]> {
    return await this.fineBonusRepository.query(
      `SELECT id, name, type FROM fine_and_bonus ORDER BY name ASC`,
    );
  }

  async createFineBonus(param: CreateFineBonusDto): Promise<{ id: number }> {
    const name = param.name.trim();
    await this.assertUniqueName(name);
    const saved = await this.fineBonusRepository.save({ name, type: param.type });
    return { id: saved.id };
  }

  async updateFineBonus(param: UpdateFineBonusDto): Promise<{ is_ok: boolean }> {
    const current = await this.fineBonusRepository.findOneBy({ id: param.id });
    if (!current) {
      throw new HttpException('Штраф или бонус не найден', HttpStatus.NOT_FOUND);
    }
    const name = param.name.trim();
    await this.assertUniqueName(name, param.id);
    await this.fineBonusRepository.update(param.id, { name, type: param.type });
    return { is_ok: true };
  }

  async listUserFineBonus(param: ListUserFineBonusDto): Promise<{
    list_user_fine_bonus: {
      id: number,
      event_id: number,
      event_name: string,
      work_shift_id: number,
      call_date_start: string,
      comment: string,
      user_id: number,
      user_name: string,
      user_who_changed: number,
      changed_by_name: string,
      type: FineBonusType,
      created_at: string,
      updated_at: string,
    }[],
    pagination: PaginationI,
  }> {
    const page = Number.isInteger(param?.page) && param.page >= 0 ? param.page : 0;
    const limit = Number.isInteger(param?.limit_page) && param.limit_page > 0
      ? Math.min(param.limit_page, 30)
      : 30;
    const values: Array<string | number> = [];
    const where: string[] = [];

    if (param?.type === FineBonusType.fine || param?.type === FineBonusType.bonus) {
      values.push(param.type);
      where.push(`ufb.type = $${values.length}`);
    }
    if (Number.isInteger(param?.user_id) && param.user_id > 0) {
      values.push(param.user_id);
      where.push(`ufb.user_id = $${values.length}`);
    }
    if (Number.isInteger(param?.event_id) && param.event_id > 0) {
      values.push(param.event_id);
      where.push(`ufb.event_id = $${values.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const fromSql = `
      FROM user_fine_bonus ufb
      LEFT JOIN event e ON e.id = ufb.event_id
      LEFT JOIN work_shift ws ON ws.id = ufb.work_shift_id
      LEFT JOIN "user" uu ON uu.id = ufb.user_id
      LEFT JOIN user_info ui ON ui.user_id = ufb.user_id
      LEFT JOIN "user" cu ON cu.id = ufb.user_who_changed
      LEFT JOIN user_info ci ON ci.user_id = ufb.user_who_changed
      ${whereSql}
    `;
    const countRows: { total: number }[] = await this.userFineBonusRepository.query(
      `SELECT COUNT(*)::int AS total ${fromSql}`,
      values,
    );
    const total = Number(countRows[0]?.total) || 0;
    const list_user_fine_bonus = await this.userFineBonusRepository.query(
      `SELECT ufb.id,
              ufb.event_id,
              COALESCE(e.event_name, '') AS event_name,
              ufb.work_shift_id,
              COALESCE(ws.call_date_start, '') AS call_date_start,
              ufb.comment,
              ufb.user_id,
              COALESCE(NULLIF(ui.display_name, ''), uu.login, '') AS user_name,
              ufb.user_who_changed,
              COALESCE(NULLIF(ci.display_name, ''), cu.login, '') AS changed_by_name,
              ufb.type,
              ufb.created_at,
              ufb.updated_at
       ${fromSql}
       ORDER BY ufb.id DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, page * limit],
    );

    return {
      list_user_fine_bonus,
      pagination: {
        curr_page: page,
        page_limit: limit,
        total,
        page_total: total ? Math.ceil(total / limit) : 0,
      },
    };
  }

  async createUserFineBonus(param: CreateUserFineBonusDto, req: any): Promise<{ id: number }> {
    const changedBy = Number(req?.curr_user) || 0;
    if (!changedBy) {
      throw new HttpException('Вы не авторизованы', HttpStatus.UNAUTHORIZED);
    }
    await this.assertAssignment(param);
    const saved = await this.userFineBonusRepository.save({
      event_id: param.event_id,
      work_shift_id: param.work_shift_id,
      comment: param.comment?.trim() || '',
      user_id: param.user_id,
      user_who_changed: changedBy,
      type: param.type,
    });
    return { id: saved.id };
  }

  async updateUserFineBonus(param: UpdateUserFineBonusDto, req: any): Promise<{ is_ok: boolean }> {
    const changedBy = Number(req?.curr_user) || 0;
    if (!changedBy) {
      throw new HttpException('Вы не авторизованы', HttpStatus.UNAUTHORIZED);
    }
    const current = await this.userFineBonusRepository.findOneBy({ id: param.id });
    if (!current) {
      throw new HttpException('Запись не найдена', HttpStatus.NOT_FOUND);
    }
    await this.assertAssignment(param);
    await this.userFineBonusRepository.update(param.id, {
      event_id: param.event_id,
      work_shift_id: param.work_shift_id,
      comment: param.comment?.trim() || '',
      user_id: param.user_id,
      user_who_changed: changedBy,
      type: param.type,
    });
    return { is_ok: true };
  }

  private async assertUniqueName(name: string, exceptId = 0): Promise<void> {
    if (!name) {
      throw new HttpException('Укажите название', HttpStatus.BAD_REQUEST);
    }
    const rows: { id: number }[] = await this.fineBonusRepository.query(
      `SELECT id FROM fine_and_bonus WHERE lower(name) = lower($1) AND id <> $2 LIMIT 1`,
      [name, exceptId],
    );
    if (rows.length) {
      throw new HttpException('Такое название уже есть', HttpStatus.FORBIDDEN);
    }
  }

  private async assertAssignment(param: CreateUserFineBonusDto): Promise<void> {
    const events: { id: number }[] = await this.fineBonusRepository.query(
      `SELECT id FROM event WHERE id = $1`,
      [param.event_id],
    );
    if (!events.length) {
      throw new HttpException('Событие не найдено', HttpStatus.NOT_FOUND);
    }
    const shifts: { id: number, event_id: number }[] = await this.fineBonusRepository.query(
      `SELECT id, event_id FROM work_shift WHERE id = $1`,
      [param.work_shift_id],
    );
    if (!shifts.length) {
      throw new HttpException('Смена не найдена', HttpStatus.NOT_FOUND);
    }
    if (Number(shifts[0].event_id) !== param.event_id) {
      throw new HttpException('Смена не относится к выбранному событию', HttpStatus.BAD_REQUEST);
    }
    const users: { id: number }[] = await this.fineBonusRepository.query(
      `SELECT id FROM "user" WHERE id = $1 AND access_lvl >= 1`,
      [param.user_id],
    );
    if (!users.length) {
      throw new HttpException('Сотрудник не найден', HttpStatus.NOT_FOUND);
    }
  }
}
