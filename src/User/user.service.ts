import { forwardRef, HttpException, HttpStatus, Inject, Injectable, Req } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './Entity/user.entity';
import { canChangeOwnPassword, updateUserPasswordDto, UserCreateDto, UserDto } from './Dto/user.dto';
import { UpdateSelfEmailDto, UpdateSelfPasswordDto, UpdateSelfPhoneDto } from './Dto/user_self.dto';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { UserInfo } from './Entity/user_info.entity';
import { UpdateUserInfoDto } from './Dto/user_info.dto';

export const secret = 'lsФмъ\\dk*&^счмисмч&*Tjh;(*jkjlo]орориваfJHjhs'; // TODO вынести в конфиг

@Injectable()
export class UsersService {

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
  * Создать рут пользователя
  */
  async createRootUser(): Promise<string> {

    let message = 'не удалось создать root пользователя';

    const vExistUser = await this.userRepository.findOneBy({ login: 'alex' });

    if (vExistUser) {
      message = 'root пользователь уже существует, удаление возможно только вручную из БД';

    } else {
      const pswd = bcrypt.hashSync('123'); // TODO придумать пароль для прода
      const vUser = this.userRepository.create({ login: 'alex', access_lvl: 100, pswd });

      const vUpdateResult = await this.userRepository.save(vUser);

      // Генерируем токен после сохранения, когда id уже присвоен
      vUser.token = this.createNewToken(vUser.id, vUser.access_lvl);
      await this.userRepository.save(vUser);
      const vUpdateResult2 = this.userInfoRepository.save({ user_id: vUser.id, display_name: 'alex' });

      if (vUser && vUpdateResult && vUpdateResult2) {
        message = 'root пользователь создан >>> ОБЯЗАТЕЛЬНО СМЕНИТЕ ПАРОЛЬ В МЕТОДЕ user/update-user-password<<<'
      }
    }

    return message;
  }

  /**
   * Регистрация пользователя
   */
  async register(param: UserCreateDto): Promise<{ token: string }> {
    param.login = param.login.toLowerCase();
    param.pswd = param.pswd.trimEnd();
    if (param.email) param.email = param.email.trimEnd();
    let sToken: string = null;

    let vExistUser = await this.userRepository.findOneBy({ login: param.login });
    if (vExistUser) {
      throw new HttpException('Пользователь с таким логином уже существует', HttpStatus.FORBIDDEN);

      vExistUser = await this.userRepository.findOneBy({ email: param.email });

    } else if (vExistUser && param.email) {

      throw new HttpException('Пользователь с таким email уже существует', HttpStatus.FORBIDDEN);

    } else {

      const vInsertData: UserDto = {
        access_lvl: 1,
        pswd: bcrypt.hashSync(param.pswd, 13),
        login: param.login,
        email: param.email,
      }

      const vUser = await this.userRepository.save(vInsertData);

      // Генерируем токен после сохранения, когда id уже присвоен
      sToken = this.createNewToken(vUser.id, vUser.access_lvl);
      await this.userRepository.update(vUser.id, { token: sToken });

      await this.userInfoRepository.save({ user_id: vUser.id, display_name: vUser.login });

    }

    return { token: sToken };
  }

  /**
   * Обновить инфо о пользователе
   */
  async updateUserInfo(param: UpdateUserInfoDto, req: any): Promise<{ is_ok: boolean, message: string }> {

    let isOk = false;
    let sMessage = 'Не удалось обновить информацию о пользователе';

    const idUser = req?.curr_user ?? 0;;

    if (!idUser) {
      throw new HttpException('Текущий пользователь не опознан', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    if (param.phone) param.phone = param.phone.trimEnd();

    let [vUserInfo, vUser] = await Promise.all([
      this.userInfoRepository.findOneBy({ user_id: idUser }),
      this.userRepository.findOneBy({ id: idUser }),
    ]);

    if (vUserInfo) {

      if (vUserInfo.user_id === idUser) {
        const vUpdateResult = await this.userInfoRepository.update(vUserInfo.id, param);

        if (vUpdateResult) {
          isOk = true;
          sMessage = 'Информация обновлена';
        }
      }

    } else {
      param.user_id = idUser;

      vUserInfo = await this.userInfoRepository.save(param);

      isOk = true;
      sMessage = 'Информация создана';

    }

    return { is_ok: isOk, message: sMessage };
  }

  /**
   * Обновить пароль пользователю
   */
  async updateUserPassword(param: updateUserPasswordDto, req: any): Promise<{ is_ok: boolean, message: string, token: string }> {

    let isOk = false;
    let sMessage = 'Не удалось сменить пароль';
    let sNewToken = '';

    const idUser = param?.curr_user ?? 0;
    if (param.pswd) param.pswd = param.pswd.trimEnd();

    if (idUser) {
      throw new HttpException('Текущий пользователь не опознан', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const vUser = await this.userRepository.findOneBy({ id: idUser });

    if (!param.is_ok) {
      throw new HttpException('Не получено согласие от пользователя', HttpStatus.FORBIDDEN);

    } else if (vUser) {

      const sNewPswd = bcrypt.hashSync(param.pswd, 13);

      sNewToken = this.createNewToken(idUser, vUser.access_lvl);

      if (sNewToken) {

        const vUpdateResult = await this.userRepository.update(idUser, { token: sNewToken, pswd: sNewPswd });


        if (vUpdateResult) {
          isOk = true;
          sMessage = 'Пароль удачно обновлен'
        }
      }

    }

    return { is_ok: isOk, message: sMessage, token: sNewToken };
  }

  /**
   * Телефон текущего пользователя. Новое значение вводится дважды.
   */
  async updateSelfPhone(param: UpdateSelfPhoneDto, req: any): Promise<{ is_ok: boolean }> {
    const idUser = await this.requireSelfId(req);
    param.phone = param.phone.trimEnd();
    param.phone_repeat = param.phone_repeat.trimEnd();
    if (param.phone !== param.phone_repeat) {
      throw new HttpException('Телефон и повтор не совпадают', HttpStatus.BAD_REQUEST);
    }
    await this.saveSelfPhone(idUser, param.phone);
    return { is_ok: true };
  }

  /**
   * Почта текущего пользователя. Новое значение вводится дважды.
   */
  async updateSelfEmail(param: UpdateSelfEmailDto, req: any): Promise<{ is_ok: boolean }> {
    const idUser = await this.requireSelfId(req);
    const email = param.email.trimEnd();
    if (email.toLowerCase() !== param.email_repeat.trimEnd().toLowerCase()) {
      throw new HttpException('Почта и повтор не совпадают', HttpStatus.BAD_REQUEST);
    }
    const taken: { id: number }[] = await this.userRepository.query(
      `SELECT id FROM "user" WHERE lower(email) = lower($1) AND id <> $2 LIMIT 1`,
      [email, idUser],
    );
    if (taken.length) {
      throw new HttpException('Такая почта уже занята', HttpStatus.FORBIDDEN);
    }
    await this.userRepository.update(idUser, { email });
    return { is_ok: true };
  }

  /**
   * Пароль текущего пользователя. Новое значение вводится дважды.
   */
  async updateSelfPassword(param: UpdateSelfPasswordDto, req: any): Promise<{ is_ok: boolean, token: string }> {
    const idUser = await this.requireSelfId(req);
    param.pswd = param.pswd.trimEnd();
    param.pswd_repeat = param.pswd_repeat.trimEnd();
    if (param.pswd !== param.pswd_repeat) {
      throw new HttpException('Пароль и повтор не совпадают', HttpStatus.BAD_REQUEST);
    }
    const user = await this.userRepository.findOneBy({ id: idUser });
    if (!user) {
      throw new HttpException('Вы не авторизованы', HttpStatus.UNAUTHORIZED);
    }
    if (!canChangeOwnPassword(Number(user.access_lvl))) {
      throw new HttpException('Нельзя сменить свой пароль', HttpStatus.FORBIDDEN);
    }
    const token = this.createNewToken(idUser, user.access_lvl);
    await this.userRepository.update(idUser, { pswd: bcrypt.hashSync(param.pswd, 13), token });
    return { is_ok: true, token };
  }

  private async requireSelfId(req: any): Promise<number> {
    const idUser = Number(req?.curr_user) || 0;
    if (!idUser) {
      throw new HttpException('Вы не авторизованы', HttpStatus.UNAUTHORIZED);
    }
    return idUser;
  }

  private async saveSelfPhone(idUser: number, phone: string): Promise<void> {
    const [info, user] = await Promise.all([
      this.userInfoRepository.findOneBy({ user_id: idUser }),
      this.userRepository.findOneBy({ id: idUser }),
    ]);
    if (info) {
      await this.userInfoRepository.update(info.id, { phone });
      return;
    }
    await this.userInfoRepository.save({
      user_id: idUser,
      phone,
      display_name: user?.login || `user_${idUser}`,
      name: '',
      surname: '',
      fathername: '',
    });
  }

  /**
 * Пересоздать токен
 */
  async recreateUserToken(idUser: number): Promise<boolean> {
    const vUser = await this.userRepository.findOneBy({ id: idUser });
    let isOk = false

    if (vUser) {
      const sNewToken = this.createNewToken(idUser, vUser.access_lvl);

      if (sNewToken) {

        const vUpdateResult = await this.userRepository.update(idUser, { token: sNewToken });

        if (vUpdateResult) {
          isOk = true;
        }
      }

    }

    return isOk;
  }

  /**
   * LogIn
   */
  public async logIn(data: { login: string, pswd: string }): Promise<{ token: string }> {
    let isCanLogin = false;
    let sToken = '';

    data.login = data.login.toLocaleLowerCase();
    data.pswd = data.pswd.trimEnd();
    // Получить инфо пользователя
    const userInfo = await this.userRepository.findOneBy({ login: data.login });

    if (userInfo?.id && userInfo.pswd) {
      // Если пароль совпадает
      isCanLogin = await bcrypt.compare(data.pswd, userInfo.pswd);
    }

    if (isCanLogin) {
      sToken = this.createNewToken(userInfo.id, userInfo.access_lvl);
      await this.userRepository.update(userInfo.id, { token: sToken });
    }
    if (!sToken) {
      throw new HttpException('Ошибка при вводе логина или пароля', HttpStatus.FORBIDDEN);
    }

    return { token: sToken };
  }

  /**
 * Получить данные текущего пользователя
 */
  async getSelfInfo(data: { curr_user?: number }): Promise<{ user: User, user_info: UserInfo }> {

    const idCurrUser = data?.curr_user ?? 0;

    if (!idCurrUser) {
      throw new HttpException('Вы не авторизованы', HttpStatus.UNAUTHORIZED);
    }
    const [vUser, vUserInfo] = await Promise.all([
      this.userRepository.findOneBy({ id: idCurrUser }),
      this.userInfoRepository.findOneBy({ user_id: idCurrUser }),
    ]);

    const user = { ...vUser };
    delete user.pswd;
    return { user, user_info: vUserInfo };

  }

  /**
   * Смены и штрафы текущего пользователя для главной страницы
   */
  async getMyHome(data: { curr_user?: number }): Promise<{
    upcoming_shifts: { shift_id: number, event_name: string, call_date_start: string, call_date_end: string }[],
    completed_shifts: { shift_id: number, event_name: string, call_date_start: string, call_date_end: string }[],
    fines: { id: number, event_name: string, comment: string, created_at: string }[],
  }> {
    const userId = Number(data?.curr_user) || 0;
    if (!userId) {
      throw new HttpException('Вы не авторизованы', HttpStatus.UNAUTHORIZED);
    }

    const shiftFrom = `
      FROM work_shift ws
      LEFT JOIN event e ON e.id = ws.event_id
      WHERE (
        EXISTS (
          SELECT 1 FROM work_shift_user wsu
          WHERE wsu.work_shift_id = ws.id AND wsu.user_id = $1
        )
        OR ws.master_user_id = $1
      )
    `;
    const endsAt = `GREATEST(
      ws.call_date_start::timestamp,
      COALESCE(NULLIF(ws.call_date_end, ''), ws.call_date_start)::timestamp
    )`;
    const shiftSelect = `SELECT ws.id AS shift_id,
              COALESCE(e.event_name, '') AS event_name,
              COALESCE(ws.call_date_start, '') AS call_date_start,
              COALESCE(ws.call_date_end, '') AS call_date_end`;

    const upcoming_shifts = await this.userRepository.query(
      `${shiftSelect}
       ${shiftFrom}
         AND ws.status IN ('enable', 'correction')
         AND ${endsAt} > NOW()
       ORDER BY ws.call_date_start::timestamp ASC, ws.id ASC
       LIMIT 10`,
      [userId],
    );
    const completed_shifts = await this.userRepository.query(
      `${shiftSelect}
       ${shiftFrom}
         AND ws.status = 'enable'
         AND ${endsAt} <= NOW()
       ORDER BY ${endsAt} DESC, ws.id DESC
       LIMIT 3`,
      [userId],
    );
    const fines = await this.userRepository.query(
      `SELECT ufb.id,
              COALESCE(e.event_name, '') AS event_name,
              COALESCE(ufb.comment, '') AS comment,
              ufb.created_at
       FROM user_fine_bonus ufb
       LEFT JOIN event e ON e.id = ufb.event_id
       WHERE ufb.user_id = $1 AND ufb.type = 'fine'
       ORDER BY ufb.created_at::timestamp DESC, ufb.id DESC
       LIMIT 5`,
      [userId],
    );

    return { upcoming_shifts, completed_shifts, fines };
  }


}
