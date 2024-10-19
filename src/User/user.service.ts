import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './Entity/user.entity';
import { updateUserPasswordDto, UserCreateDto } from './Dto/user.dto';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { ctx } from 'src/main';

export const secret = 'lsФмъ\\dk*&^счмисмч&*Tjh;(*jkjlo]орориваfJHjhs'; // TODO вынести в конфиг

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,

  ) {}

  /**
   * Создание токена для авторизации
   */
  private createNewToken = (id: number, lvl: number) => {
    const payload = { id, lvl }
    return jwt.sign(payload, secret, { expiresIn: '3650' }); // Токен на 10 лет, пока для всех
  }

  /**
* Пересоздать токен
*/
  async createRootUser(): Promise<string> {

    let message = 'не удалось создать root пользователя';

    const vExistUser = await this.usersRepository.findOneBy({ login: 'alex' });

    if (vExistUser) {
      message = 'root пользователь уже существует, удаление возможно только вручную из БД';

    } else {
      const pswd = bcrypt.hashSync('123');
      const vUser = this.usersRepository.create({ login: 'alex', access_lvl: 100, pswd });

      vUser.token = this.createNewToken(vUser.id, vUser.access_lvl);

      const vUpdateResult = await this.usersRepository.save(vUser);

      if (vUser && vUpdateResult) {
        message = 'root пользователь создан >>> ОБЯЗАТЕЛЬНО СМЕНИТЕ ПАРОЛЬ В МЕТОДЕ user/update-user-password<<<'
      }
    }

    return message;
  }


  /**
   * Регистрация пользователя
   */
  async register(param: UserCreateDto): Promise<string> {
    param.login = param.login.toLowerCase();
    let sResponse = 'Ошибка при создании пользователя';

    let vExistUser = await this.usersRepository.findOneBy({ login: param.login });
    if (vExistUser) {
      sResponse = 'Пользователь с таким логином уже существует'
      vExistUser = await this.usersRepository.findOneBy({ email: param.login });

    } else if (vExistUser) {
      sResponse = 'Пользователь с email логином уже существует';

    } else {
      param.access_lvl = 1;
      param.pswd = bcrypt.hashSync(param.pswd, 13);
      const user = this.usersRepository.create(param);

      user.token = this.createNewToken(user.id, user.access_lvl);
      await this.usersRepository.save(user);

      sResponse = 'Пользователь создан';
    }

    return sResponse;
  }

  /**
   * Обновить пароль пользователю
   */
  async updateUserPassword(param: updateUserPasswordDto): Promise<{ is_ok: boolean, message: string, token: string }> {

    let isOk = false;
    let sMessage = 'Не удалось сменить пароль';
    let sNewToken = '';

    const idUser = ctx.userSys.user_id;

    if (!ctx.userSys.user_id) {
      throw new Error('Текущий пользователь не опознан');
    }

    const vUser = await this.usersRepository.findOneBy({ id: idUser });

    if (!param.is_ok) {
      sMessage = 'Не получено согласие от пользователя';

    } else if (vUser) {

      const sNewPswd = bcrypt.hashSync(param.pswd, 13);

      sNewToken = this.createNewToken(idUser, vUser.access_lvl);

      if (sNewToken) {

        const vUpdateResult = await this.usersRepository.update(idUser, { token: sNewToken, pswd: sNewPswd });


        if (vUpdateResult) {
          isOk = true;
          sMessage = 'Пароль удачно обновлен'
        }
      }

    }

    return { is_ok: isOk, message: sMessage, token: sNewToken };
  }

  /**
 * Пересоздать токен
 */
  async recreateUserToken(idUser: number): Promise<boolean> {
    const vUser = await this.usersRepository.findOneBy({ id: idUser });
    let isOk = false

    if (vUser) {
      const sNewToken = this.createNewToken(idUser, vUser.access_lvl);

      if (sNewToken) {

        const vUpdateResult = await this.usersRepository.update(idUser, { token: sNewToken });

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
  public async logIn(data: { login: string, pswd: string }): Promise<string> {
    let isCanLogin = false;
    let sToken = 'ERROR';

    // Получить инфо пользователя
    const userInfo = await this.usersRepository.findOneBy({ login: data.login });

    if (userInfo?.id && userInfo.pswd) {
      // Если пароль совпадает
      isCanLogin = await bcrypt.compare(data.pswd, userInfo.pswd);
    }

    if (isCanLogin && userInfo.token) {
      sToken = userInfo.token;
    } else if (isCanLogin) {

      sToken = this.createNewToken(userInfo.id, userInfo.access_lvl);
      await this.usersRepository.update(userInfo.id, { token: sToken });
    }

    return sToken;
  }

}
