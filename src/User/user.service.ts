import { forwardRef, HttpException, HttpStatus, Inject, Injectable, Req } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './Entity/user.entity';
import { updateUserPasswordDto, UserCreateDto, UserDto } from './Dto/user.dto';
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

      vUser.token = this.createNewToken(vUser.id, vUser.access_lvl);

      const vUpdateResult = await this.userRepository.save(vUser);
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

      sToken = this.createNewToken(vUser.id, vUser.access_lvl);
      vUser.token = sToken;
      await Promise.all([
        this.userRepository.save(vUser),
        this.userInfoRepository.save({ user_id: vUser.id, display_name: vUser.login }),
      ])

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

    return { user: vUser, user_info: vUserInfo };

  }


}
