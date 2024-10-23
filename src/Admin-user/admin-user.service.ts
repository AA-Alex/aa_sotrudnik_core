import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { ctx } from 'src/main';
import { User } from 'src/User/Entity/user.entity';
import { UserInfo } from 'src/User/Entity/user_info.entity';
import { CreateUserByAdminDto, ListUserDto, UpdateUserByAdminDto } from './Dto/admin-user.dto';
import { secret } from 'src/User/user.service';


@Injectable()
export class AdminUsersService {

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserInfo)
    private userInfoRepository: Repository<UserInfo>,

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
    user_id: number,
    login: string,
    access_lvl: number,
    email: string,
    display_name: string,
    name: string,
    fathername: string,
    phone: string
  }[]> {

    if (!param.page) param.page = 0;
    if (!param.limit_page) param.limit_page = 30;

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

    let sBySoname = '';
    if (param.soname) {
      sByLogin = `AND ui.soname like('%${param.soname}%')`;
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
    SELECT u.id AS user_id, u.login, u.access_lvl, u.email, ui.display_name, ui.name, ui.soname, ui.fathername, ui.phone
    FROM "user" u
    LEFT JOIN user_info ui ON ui.user_id = u.id
    ${sByLogin}
    ${sByEmail}
    ${sByName}
    ${sBySoname}
    ${sByDisplayName}
    ${sByPhone}
    ${sByUserId}
    ORDER BY u.id ASC
    ${sOffset}
    ${sLimit}
    ;
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
    }[] = await this.userRepository.query(sql);

    return aUserData;
  }

  /**
 * Регистрация пользователя
 */
  async createUser(param: CreateUserByAdminDto): Promise<string> {
    param.login = param.login.toLowerCase();
    let sResponse = 'Ошибка при создании пользователя';

    let vExistUser = await this.userRepository.findOneBy({ login: param.login });
    if (vExistUser) {
      sResponse = 'Пользователь с таким логином уже существует'
    } else {
      param.pswd = bcrypt.hashSync(param.pswd, 13);
      const vUser = await this.userRepository.save({ ...param, access_lvl: 1 });

      vUser.token = this.createNewToken(vUser.id, vUser.access_lvl);
      await Promise.all([
        this.userRepository.save(vUser),
        this.userInfoRepository.save({ user_id: vUser.id, display_name: param.soname, soname: param.soname, name: param.name }),
      ])

      sResponse = 'Пользователь создан';
    }

    return sResponse;
  }

  /**
 * Обновить инфо о пользователе
 */
  async updateUserInfo(param: UpdateUserByAdminDto): Promise<{ is_ok: boolean, message: string }> {
    if (!param.user_id) {
      throw new Error('Не указан id пользователя');
    }
    const idUser = param.user_id;

    let isOk = false;
    let sMessage = 'Не удалось обновить информацию о пользователе';

    let [vUserInfo, vUser] = await Promise.all([
      this.userInfoRepository.findOneBy({ user_id: idUser }),
      this.userRepository.findOneBy({ id: idUser }),
    ]);

    if (!vUser) {
      throw new Error('Не удалось найти пользователя по id');
    }

    if (param.login) {
      let vExistUser = await this.userRepository.findOneBy({ login: param.login });
      if (!vExistUser || (vExistUser.login && param.login === vExistUser.login)) {
        isOk = true;
      } else {
        sMessage = `Пользователь с таким логином ${param.login} уже существует`;
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
          vUserInfo.id, { user_id: param.user_id, name: param.name, soname: param.soname, fathername: param.fathername, phone: param.phone }
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
          { user_id: param.user_id, display_name: sDisplayName, name: param.name, soname: param.soname, fathername: param.fathername, phone: param.phone }
        );

        isOk = true;
        sMessage = 'Информация создана';

      }
    }

    return { is_ok: isOk, message: sMessage };
  }
}
