import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { ctx, PaginationI } from 'src/main';
import { User } from 'src/User/Entity/user.entity';
import { UserInfo } from 'src/User/Entity/user_info.entity';
import { UserTagDto, CreateUserByAdminDto, ListUserDto, UpdateUserByAdminDto } from './Dto/admin-user.dto';
import { secret } from 'src/User/user.service';
import { UserTag } from 'src/User/Entity/user_tag.entity';


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

    let sByLogin = 'WHERE u.login IS NOT NULL';
    if (param.login) {
      sByLogin = `WHERE u.login like('%${param.login}%')`;
    }

    let sByEmail = '';
    if (param.email) {
      sByLogin = `AND u.email like('%${param.email}%')`;
    }

    let sByName = '';
    if (param.name) {
      sByLogin = `AND ui.name like('%${param.name}%')`;
    }

    let sBySurname = '';
    if (param.surname) {
      sByLogin = `AND ui.surname like('%${param.surname}%')`;
    }

    let sByDisplayName = '';
    if (param.display_name) {
      sByLogin = `AND ui.display_name like('%${param.display_name}%')`;
    }

    let sByPhone = '';
    if (param.phone) {
      sByLogin = `AND ui.phone like('%${param.phone}%')`;
    }

    let sByUserId = '';
    if (param.user_id) {
      sByLogin = `AND u.id = ${param.user_id}`;
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
      page_total: iCount / param.limit_page,             // Всего страниц
      page_limit: param.limit_page,                      // Всего количество на странице
    };

    return { list_user: aUserData, pagination }
  }

  /**
 * Регистрация пользователя
 */
  async createUser(param: CreateUserByAdminDto): Promise<{ user: User, user_info: UserInfo }> {
    param.login = param.login.toLowerCase();
    let out: { user: User, user_info: UserInfo } = null;

    let vExistUser = await this.userRepository.findOneBy({ login: param.login });
    if (vExistUser) {
      throw new HttpException('Пользователь с таким логином уже существует', HttpStatus.FORBIDDEN);
    } else {
      param.pswd = bcrypt.hashSync(param.pswd, 13);
      const vUser = await this.userRepository.save({ ...param, access_lvl: 1 });

      vUser.token = this.createNewToken(vUser.id, vUser.access_lvl);
      const [vNewUser, vNewUserInfo] = await Promise.all([
        this.userRepository.save(vUser),
        this.userInfoRepository.save({ user_id: vUser.id, display_name: param.surname, surname: param.surname, name: param.name }),
      ]);

      out = { user: vNewUser, user_info: vNewUserInfo }

    }

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

        const vUpdateResult = await this.userInfoRepository.update(
          vUserInfo.id, { user_id: param.user_id, name: param.name, surname: param.surname, fathername: param.fathername, phone: param.phone }
        );

        if (vUpdateResult) {
          isOk = true;
          sMessage = 'Информация обновлена';
        }

      } else {
        param.user_id = idUser;

        vUser = await this.userRepository.findOneBy({ id: idUser });
        let sDisplayName = param?.display_name || vUser.login;

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
}
