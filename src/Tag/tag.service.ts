import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ctx } from 'src/main';
import { CreateTagDto, ListTagDto, UpdateTagDto } from './Dto/tag.dto';
import { Tag } from 'src/Tag/Entity/tag.entity';
import { User } from 'src/User/Entity/user.entity';
import { UserInfo } from 'src/User/Entity/user_info.entity';


@Injectable()
export class TagService {

  constructor(
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserInfo)
    private userInfoRepository: Repository<UserInfo>,

  ) {}

  /**
  * Получить теги
  */
  async listTag(param: ListTagDto): Promise<{
    tag_id: number,
    tag_name: string,
    user_id: number,
    created_at: string,
    updated_at: string,
  }[]> {

    if (!param.page) param.page = 0;
    if (!param.limit_page) param.limit_page = 30;

    const sLimit = `LIMIT ${param.limit_page}`;
    const sOffset = `OFFSET ${param.page * param.limit_page}`;

    let sByTagName = 'WHERE t.tag_name IS NOT NULL';
    if (param.tag_name) {
      sByTagName = `WHERE t.tag_name like('%${param.tag_name}%')`;
    }

    let sByUserId = '';
    if (param.user_id) {
      sByUserId = `AND t.user_id = ${param.user_id}`;
    }

    const sql = `
    SELECT t.*
    FROM "tag" t
    ${sByTagName}
    ${sByUserId}
    ORDER BY t.id ASC
    ${sOffset}
    ${sLimit}
    ;
    `;

    const aTagData: {
      tag_id: number,
      tag_name: string,
      user_id: number,
      created_at: string,
      updated_at: string,
    }[] = await this.tagRepository.query(sql);

    return aTagData;
  }

  /**
 * Регистрация пользователя
 */
  async createTag(param: CreateTagDto): Promise<string> {
    param.tag_name = param.tag_name.toLowerCase();
    let sResponse = 'Ошибка при создании тега';

    let vExistTag = await this.tagRepository.findOneBy({ tag_name: param.tag_name });
    if (vExistTag) {
      sResponse = 'Тег с таким названием уже существует'
    } else {
      const vTag = await this.tagRepository.save({ ...param, user_id: ctx.userSys.user_id });

      if (vTag?.id) sResponse = 'Тег создан';
    }

    return sResponse;
  }

  /**
 * Обновить инфо тег
 */
  async updateUserInfo(param: UpdateTagDto): Promise<{ is_ok: boolean, message: string }> {
    if (!param.tag_id) {
      throw new Error('Не указан id тега');
    }
    const idTag = param.tag_id;

    let isOk = false;
    let sMessage = 'Не удалось обновить информацию о теге';

    const vTag = await this.tagRepository.findOneBy({ id: idTag });


    if (!vTag) {
      throw new Error('Не удалось найти тег по id');
    }

    if (param.tag_name) {
      let vExistTag = await this.tagRepository.findOneBy({ tag_name: param.tag_name });
      if (!vExistTag || (vExistTag.tag_name && param.tag_name === vExistTag.tag_name)) {
        isOk = true;
      } else {
        sMessage = `Тег с таким названием ${param.tag_name} уже существует`;
      }

    }

    if (isOk) {
      await this.tagRepository.update(idTag, { tag_name: param.tag_name, user_id: ctx.userSys.user_id });
      isOk = true;
      sMessage = 'Информация обновлена';
    }

    return { is_ok: isOk, message: sMessage };
  }
}
