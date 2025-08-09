import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  ) {}

  /**
  * Получить смены
  */
  // async listWorkShift(param: WorkShiftDTO): Promise<{
  //   tag_id: number,
  //   tag_name: string,
  //   user_id: number,
  //   created_at: string,
  //   updated_at: string,
  // }[]> {

  //   if (!param.page) param.page = 0;
  //   if (!param.limit_page) param.limit_page = 30;

  //   const sLimit = `LIMIT ${param.limit_page}`;
  //   const sOffset = `OFFSET ${param.page * param.limit_page}`;

  //   let sByTagName = 'WHERE t.tag_name IS NOT NULL';
  //   if (param.tag_name) {
  //     sByTagName = `WHERE t.tag_name like('%${param.tag_name}%')`;
  //   }

  //   let sByUserId = '';
  //   if (param.user_id) {
  //     sByUserId = `AND t.user_id = ${param.user_id}`;
  //   }

  //   const sql = `
  //   SELECT t.*
  //   FROM "tag" t
  //   ${sByTagName}
  //   ${sByUserId}
  //   ORDER BY t.id ASC
  //   ${sOffset}
  //   ${sLimit}
  //   ;
  //   `;

  //   const aTagData: {
  //     tag_id: number,
  //     tag_name: string,
  //     user_id: number,
  //     created_at: string,
  //     updated_at: string,
  //   }[] = await this.tagRepository.query(sql);

  //   return aTagData;
  // }

  /**
   * Создать смену
   */
  async createWorkShift(param: CreateWorkShiftDTO, req: any): Promise<string> {
    const aidUserWorker = param.list_user_id || []; // Список id сотрудников

    // хз как это на несте валидировать, пусть пока тут полежит
    if (!aidUserWorker.length) {
      throw new HttpException('Не указаны сотрудники для вызова', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    for (let i = 0; i < aidUserWorker.length; i++) {
      const idUserWorker = aidUserWorker[i];

      if (!idUserWorker || !Number(idUserWorker) || !Number.isInteger(idUserWorker) || idUserWorker <= 0) {
        throw new HttpException('Внутренняя ошибка, некорректные id сотрудников', HttpStatus.INTERNAL_SERVER_ERROR);
      }

    }

    let sResponse = '';
    const idUser = req?.curr_user ?? 0;

    const vWorkShift = await this.workShiftRepository.save({ ...param, user_id: idUser });

    if (vWorkShift?.id) {
      const aWorkShiftUserInsert: WorkShiftUser[] = [];

      for (let i = 0; i < aidUserWorker.length; i++) {
        aWorkShiftUserInsert.push({
          user_id: aidUserWorker[i],
          work_shift_id: vWorkShift.id,
        })

      }

      const aWorkShiftUser = await this.workShiftRepositoryUser.save(aWorkShiftUserInsert);

      if (aWorkShiftUser?.length) {
        sResponse = 'Смена создана';
      } else {
        await this.workShiftRepository.delete({ id: vWorkShift.id })
      }

    } else {
      throw new HttpException('Ошибка при создании смены', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return sResponse;
  }

  /**
   * Обновить смену
   */
  // async updateTag(param: UpdateTagDto, req: any): Promise<{ is_ok: boolean, message: string }> {
  //   const idTag = param.tag_id;
  //   const idUser = req?.curr_user ?? 0;

  //   if (!idTag) {
  //     throw new HttpException('Не указан id тега', HttpStatus.INTERNAL_SERVER_ERROR);
  //   }

  //   let isOk = false;
  //   let sMessage = 'Не удалось обновить информацию о теге';

  //   const vTag = await this.tagRepository.findOneBy({ id: idTag });
  //   if (!vTag) {
  //     throw new HttpException('Не удалось найти тег по id', HttpStatus.INTERNAL_SERVER_ERROR);
  //   }

  //   if (param.tag_name) {
  //     param.tag_name = param.tag_name.toLocaleLowerCase();
  //     let vExistTag = await this.tagRepository.findOneBy({ tag_name: param.tag_name });

  //     if (!vExistTag || (vExistTag.tag_name && param.tag_name === vExistTag.tag_name)) {
  //       isOk = true;
  //     } else {
  //       throw new HttpException(`Тег с названием ${param.tag_name} уже существует`, HttpStatus.FORBIDDEN);
  //     }

  //   }

  //   if (isOk) {
  //     await this.tagRepository.update(idTag, { tag_name: param.tag_name, user_id: idUser });
  //     isOk = true;
  //     sMessage = 'Информация обновлена';
  //   }

  //   return { is_ok: isOk, message: sMessage };
  // }
}
