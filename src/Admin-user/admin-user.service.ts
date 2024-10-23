import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { ctx } from 'src/main';
import { User } from 'src/User/Entity/user.entity';
import { UserInfo } from 'src/User/Entity/user_info.entity';
import { ListUserDto } from './Dto/admin-user.dto';


@Injectable()
export class AdminUsersService {

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserInfo)
    private userInfoRepository: Repository<UserInfo>,

  ) {}

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

    let message = 'не удалось создать root пользователя';

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

}
