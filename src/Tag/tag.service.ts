import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    display_name: string,
    created_at: string,
    updated_at: string,
  }[]> {

    const page = Number.isInteger(param?.page) && param.page >= 0 ? param.page : 0;
    const limit = Number.isInteger(param?.limit_page) && param.limit_page > 0
      ? Math.min(param.limit_page, 30)
      : 30;
    const values: Array<string | number> = [];
    const where = ['t.tag_name IS NOT NULL'];

    const search = param?.tag_name?.trim();
    if (search) {
      const escaped = search.replace(/[\\%_]/g, '\\$&');
      values.push(`%${escaped}%`);
      where.push(`t.tag_name ILIKE $${values.length} ESCAPE '\\'`);
    }
    if (Number.isInteger(param?.user_id) && param.user_id > 0) {
      values.push(param.user_id);
      where.push(`t.user_id = $${values.length}`);
    }

    values.push(limit, page * limit);
    const sql = `
    SELECT t.id AS tag_id,
           t.tag_name,
           COALESCE(ui.display_name, '') AS display_name,
           t.created_at,
           t.updated_at
    FROM tag t
    LEFT JOIN user_info ui ON ui.user_id = t.user_id
    WHERE ${where.join(' AND ')}
    ORDER BY t.id ASC
    LIMIT $${values.length - 1} OFFSET $${values.length}
    `;

    return await this.tagRepository.query(sql, values);
  }

  /**
   * Все теги для селекторов.
   */
  async listAllTags(): Promise<{ tag_id: number, tag_name: string }[]> {
    return await this.tagRepository.query(
      `SELECT id AS tag_id, tag_name FROM tag ORDER BY tag_name ASC`,
    );
  }

  /**
 * Регистрация пользователя
 */
  async createTag(param: CreateTagDto, req: any): Promise<string> {
    param.tag_name = param.tag_name.toLowerCase();
    let sResponse = '';
    const idUser = req?.curr_user ?? 0;

    let vExistTag = await this.tagRepository.findOneBy({ tag_name: param.tag_name });
    if (vExistTag) {
      throw new HttpException('Тег с таким названием уже существует', HttpStatus.FORBIDDEN);

    } else {
      const vTag = await this.tagRepository.save({ ...param, user_id: idUser });

      if (vTag?.id) {
        sResponse = 'Тег создан';
      } else {
        throw new HttpException('Ошибка при создании тега', HttpStatus.INTERNAL_SERVER_ERROR);

      }
    }

    return sResponse;
  }

  /**
 * Обновить инфо тег
 */
  async updateTag(param: UpdateTagDto, req: any): Promise<{ is_ok: boolean, message: string }> {
    const idTag = param.tag_id;
    const idUser = req?.curr_user ?? 0;

    if (!idTag) {
      throw new HttpException('Не указан id тега', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    let isOk = false;
    let sMessage = 'Не удалось обновить информацию о теге';

    const vTag = await this.tagRepository.findOneBy({ id: idTag });
    if (!vTag) {
      throw new HttpException('Не удалось найти тег по id', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (param.tag_name) {
      param.tag_name = param.tag_name.toLocaleLowerCase();
      let vExistTag = await this.tagRepository.findOneBy({ tag_name: param.tag_name });

      if (!vExistTag || (vExistTag.tag_name && param.tag_name === vExistTag.tag_name)) {
        isOk = true;
      } else {
        throw new HttpException(`Тег с названием ${param.tag_name} уже существует`, HttpStatus.FORBIDDEN);
      }

    }

    if (isOk) {
      await this.tagRepository.update(idTag, { tag_name: param.tag_name, user_id: idUser });
      isOk = true;
      sMessage = 'Информация обновлена';
    }

    return { is_ok: isOk, message: sMessage };
  }
}
