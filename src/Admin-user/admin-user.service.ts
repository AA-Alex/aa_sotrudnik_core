import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { User } from 'src/User/Entity/user.entity';
import { UserInfo } from 'src/User/Entity/user_info.entity';
import { UserTagDto, CreateUserByAdminDto, ListUserDto, UpdateUserByAdminDto, ListActiveUsersDto } from './Dto/admin-user.dto';
import { secret } from 'src/User/user.service';
import { UserTag } from 'src/User/Entity/user_tag.entity';
import { PaginationI } from 'src/main';
import { SetUserTagsDto } from './Dto/admin-user.dto';
import { loadTagLinks, replaceTagLinks } from 'src/Tag/tag-links';


@Injectable()
export class AdminUsersService {

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserInfo)
    private userInfoRepository: Repository<UserInfo>,
    @InjectRepository(UserTag)
    private userTagRepository: Repository<UserTag>,

  ) {}

  /**
 * Создание токена для авторизации
 */
  private createNewToken = (id: number, lvl: number) => {
    const payload = { id, lvl }
    return jwt.sign(payload, secret, { expiresIn: '3650d' }); // Токен на 10 лет, пока для всех
  }

  /**
  * Получить пользователей
  */
  async listUser(param: ListUserDto): Promise<{
    list_user: {
      user_id: number,
      login: string,
      access_lvl: number,
      email: string,
      display_name: string,
      name: string,
      fathername: string,
      phone: string
    }[],
    pagination: PaginationI,
  }> {

    if (!param.page) param.page = 0;
    if (!param.limit_page) param.limit_page = 2;

    const sLimit = `LIMIT ${param.limit_page}`;
    const sOffset = `OFFSET ${param.page * param.limit_page}`;

    let sWhereOrAnd = 'WHERE';

    let sByLogin = 'WHERE u.login IS NOT NULL';
    if (param.login) {
      sByLogin = `${sWhereOrAnd} u.login like '%${param.login}%'`;
      sWhereOrAnd = 'AND';
    }

    let sByEmail = '';
    if (param.email) {
      sByEmail = `${sWhereOrAnd} u.email like '%${param.email}%'`;
      sWhereOrAnd = 'AND';
    }

    let sByName = '';
    if (param.name) {
      sByName = `${sWhereOrAnd} ui.name like '%${param.name}%'`;
      sWhereOrAnd = 'AND';
    }

    let sBySurname = '';
    if (param.surname) {
      sBySurname = `${sWhereOrAnd} ui.surname like '%${param.surname}%'`;
      sWhereOrAnd = 'AND';
    }

    let sByDisplayName = '';
    if (param.display_name) {
      sByDisplayName = `${sWhereOrAnd} ui.display_name like '%${param.display_name}%'`;
      sWhereOrAnd = 'AND';
    }

    let sByPhone = '';
    if (param.phone) {
      sByPhone = `${sWhereOrAnd} ui.phone like '%${param.phone}%'`;
      sWhereOrAnd = 'AND';
    }

    let sByUserId = '';
    if (param.user_id) {
      sByLogin = `${sWhereOrAnd} u.id = ${param.user_id}`;
      sWhereOrAnd = 'AND';
    }

    const sql = `
    FROM "user" u
    LEFT JOIN user_info ui ON ui.user_id = u.id
    ${sByLogin}
    ${sByEmail}
    ${sByName}
    ${sBySurname}
    ${sByDisplayName}
    ${sByPhone}
    ${sByUserId}
        `;

    const sqlSelect = `
    SELECT u.id AS user_id, u.login, u.access_lvl, u.email, ui.display_name, ui.name, ui.surname, ui.fathername, ui.phone 
    ${sql}
    ORDER BY u.id
    ${sOffset}
    ${sLimit}
    `;

    const aUserData: {
      user_id: number,
      login: string,
      access_lvl: number,
      email: string,
      display_name: string,
      name: string,
      fathername: string,
      phone: string
    }[] = await this.userRepository.query(sqlSelect);

    const iCount: number = (await this.userRepository.query(`SELECT COUNT(u.id) AS cnt ${sql}`))[0]?.cnt ?? 0;

    let pagination: PaginationI = {
      curr_page: param.page,                             // Текущая страница
      total: Number(iCount),                             // Всего на страницу
      page_total: Math.ceil(iCount / param.limit_page),             // Всего страниц
      page_limit: param.limit_page,                      // Всего количество на странице
    };

    const tagsByUser = await loadTagLinks(
      this.userRepository,
      'user_tag',
      aUserData.map((row) => Number(row.user_id)),
    );

    return {
      list_user: aUserData.map((row) => ({
        ...row,
        tags: tagsByUser.get(Number(row.user_id)) || [],
      })),
      pagination,
    };
  }

  /**
   * Регистрация пользователя
   */
  async createUser(param: CreateUserByAdminDto): Promise<{ user: User, user_info: UserInfo }> {
    param.login = param.login.toLowerCase();
    let out: { user: User, user_info: UserInfo } = null;

    const vExistUser = await this.userRepository.findOneBy({ login: param.login });
    if (vExistUser) {
      throw new HttpException('Пользователь с таким логином уже существует', HttpStatus.FORBIDDEN);
    }

    param.pswd = bcrypt.hashSync(param.pswd, 13);
    const vUser = await this.userRepository.save({ ...param, access_lvl: 1 });

    let sUserDisplayName = `${param.surname}_${param.name}`;

    const sql = `
      SELECT * FROM "user_info"
        WHERE display_name LIKE '%${sUserDisplayName}%' 
        ORDER BY id DESC
        LIMIT 1;
    `
    const vExistUserInfo: UserInfo[] = await this.userInfoRepository.query(sql);

    if (vExistUserInfo?.length) {
      sUserDisplayName = vExistUserInfo[0].display_name + '_';
    }

    const [vNewUser, vNewUserInfo] = await Promise.all([
      this.userRepository.save(vUser),
      this.userInfoRepository.save({ user_id: vUser.id, display_name: sUserDisplayName, surname: param.surname, name: param.name }),
    ]);

    // Генерируем токен после сохранения, когда id уже присвоен
    vNewUser.token = this.createNewToken(vNewUser.id, vNewUser.access_lvl);
    await this.userRepository.save(vNewUser);

    out = { user: vNewUser, user_info: vNewUserInfo }



    return out;
  }

  /**
 * Обновить инфо о пользователе
 */
  async updateUserInfo(param: UpdateUserByAdminDto): Promise<{ is_ok: boolean, message: string }> {
    if (!param.user_id) {
      throw new HttpException('Не указан id пользователя', HttpStatus.FORBIDDEN);
    }
    const idUser = param.user_id;

    let isOk = false;
    let sMessage = 'Не удалось обновить информацию о пользователе';

    let [vUserInfo, vUser] = await Promise.all([
      this.userInfoRepository.findOneBy({ user_id: idUser }),
      this.userRepository.findOneBy({ id: idUser }),
    ]);

    if (!vUser) {
      throw new HttpException('Не удалось найти пользователя по id', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (param.login) {
      let vExistUser = await this.userRepository.findOneBy({ login: param.login });
      if (!vExistUser || (vExistUser.login && param.login === vExistUser.login)) {
        isOk = true;
      } else {
        throw new HttpException(`Пользователь с таким логином ${param.login} уже существует`, HttpStatus.FORBIDDEN);
      }

    }

    if (isOk) {

      if (param.pswd) {
        param.pswd = bcrypt.hashSync(param.pswd, 13);

        const sNewToken = this.createNewToken(vUser.id, vUser.access_lvl);
        await this.userRepository.update(idUser, { login: param.login, access_lvl: param.access_lvl, email: param.email, token: sNewToken });

      } else {
        await this.userRepository.update(idUser, { login: param.login, access_lvl: param.access_lvl, email: param.email });
      }

      if (vUserInfo) {

        const sDisplayName = param?.display_name || vUser.login;
        const vUpdateResult = await this.userInfoRepository.update(
          vUserInfo.id, { user_id: param.user_id, display_name: sDisplayName, name: param.name, surname: param.surname, fathername: param.fathername, phone: param.phone }
        );

        if (vUpdateResult) {
          isOk = true;
          sMessage = 'Информация обновлена';
        }

      } else {
        param.user_id = idUser;

        vUser = await this.userRepository.findOneBy({ id: idUser });
        const sDisplayName = param?.display_name || vUser.login;

        vUserInfo = await this.userInfoRepository.save(
          { user_id: param.user_id, display_name: sDisplayName, name: param.name, surname: param.surname, fathername: param.fathername, phone: param.phone }
        );

        isOk = true;
        sMessage = 'Информация создана';

      }
    }

    return { is_ok: isOk, message: sMessage };
  }

  /**
  * Добавление тега сотруднику
  */
  async addUserTag(param: UserTagDto): Promise<string> {
    let sMessage = 'Не удалось добавить тег пользователю';

    const vExistUserTag = await this.userTagRepository.findOneBy({ user_id: param.user_id, tag_id: param.tag_id });

    if (vExistUserTag) {
      throw new HttpException('Такой тег уже привязан к сотруднику', HttpStatus.FORBIDDEN);

    } else {
      const vInsertResult = await this.userTagRepository.save(param);

      if (vInsertResult) {
        sMessage = 'Тег успешно привязан к сотруднику';
      } else {
        throw new HttpException('Ошибка при добавлении тега сотруднику', HttpStatus.INTERNAL_SERVER_ERROR);
      }

    }

    return sMessage;
  }

  /**
  * Удаление тега сотрудника
  */
  async delUserTag(param: UserTagDto): Promise<string> {
    let sMessage = 'Не удалось добавить тег пользователю';

    const vExistUserTag = await this.userTagRepository.findOneBy({ user_id: param.user_id, tag_id: param.tag_id });

    if (!vExistUserTag) {
      throw new HttpException('Такой тег не привязан к сотруднику', HttpStatus.FORBIDDEN);
    } else {
      const vDeleteResult = await this.userTagRepository.delete(vExistUserTag.id);

      if (vDeleteResult) {
        sMessage = 'Тег успешно отвязан от сотрудника';
      } else {
        throw new HttpException('Ошибка при удалении тега у сотрудника', HttpStatus.INTERNAL_SERVER_ERROR);
      }

    }

    return sMessage;
  }

  /**
   * Заменяет набор тегов сотрудника
   */
  async setUserTags(param: SetUserTagsDto): Promise<{ is_ok: boolean }> {
    const user = await this.userRepository.findOneBy({ id: param.user_id });
    if (!user) {
      throw new HttpException('Не удалось найти пользователя по id', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    await replaceTagLinks(this.userRepository, 'user_tag', param.user_id, param.tag_ids || []);
    return { is_ok: true };
  }
  async listActiveUsers(param: ListActiveUsersDto = {}): Promise<{
    list_user: {
      id: number,
      login: string,
      display_name: string,
      surname: string,
      name: string,
      access_lvl: number,
      created_at: string,
    }[],
    pagination: PaginationI,
  }> {
    const page = Number.isInteger(param.page) && param.page >= 0 ? param.page : 0;
    const limit = Number.isInteger(param.limit_page) && param.limit_page > 0
      ? Math.min(param.limit_page, 30)
      : 30;

    const sortColumns: Record<string, string> = {
      created_at: 'u.created_at',
      display_name: 'ui.display_name',
      access_lvl: 'u.access_lvl',
    };
    const sortColumn = sortColumns[param.sort] || 'u.created_at';
    const direction = param.sort_desc === false ? 'ASC' : 'DESC';

    const where: string[] = ['u.access_lvl >= 1'];
    const values: Array<string | number> = [];

    if (Number.isInteger(param.access_lvl)) {
      values.push(param.access_lvl);
      where.push(`u.access_lvl = $${values.length}`);
    }

    const search = param.search?.trim();
    if (search) {
      const escaped = search.replace(/[\\%_]/g, '\\$&');
      values.push(`%${escaped}%`);
      where.push(`(COALESCE(ui.surname, '') ILIKE $${values.length} ESCAPE '\\' OR COALESCE(ui.display_name, '') ILIKE $${values.length} ESCAPE '\\')`);
    }

    const whereSql = `WHERE ${where.join(' AND ')}`;
    const fromSql = `FROM "user" u LEFT JOIN user_info ui ON ui.user_id = u.id ${whereSql}`;

    const countRows: { total: number }[] = await this.userRepository.query(
      `SELECT COUNT(*)::int AS total ${fromSql}`,
      values,
    );
    const total = Number(countRows[0]?.total) || 0;

    const list_user: {
      id: number,
      login: string,
      display_name: string,
      surname: string,
      name: string,
      access_lvl: number,
      created_at: string,
    }[] = await this.userRepository.query(
      `SELECT u.id,
              u.login,
              COALESCE(ui.display_name, '') AS display_name,
              COALESCE(ui.surname, '') AS surname,
              COALESCE(ui.name, '') AS name,
              u.access_lvl,
              u.created_at
       ${fromSql}
       ORDER BY ${sortColumn} ${direction}, u.id DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, page * limit],
    );

    return {
      list_user,
      pagination: {
        curr_page: page,
        page_limit: limit,
        total,
        page_total: total ? Math.ceil(total / limit) : 0,
      },
    };
  }
}
