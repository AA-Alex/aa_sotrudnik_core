import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { updateUserPasswordDto, UserCreateDto } from './user.dto';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

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
    return jwt.sign(payload, secret, { expiresIn: '7d' });
  }

  /**
   * Создать пользователя
   */
  async create(param: UserCreateDto): Promise<string> {
    param.login = param.login.toLowerCase();
    let sResponse = 'Ошибка при создании пользователя';

    const vExistUser = await this.usersRepository.findOneBy({ login: param.login })
    if (vExistUser) {
      sResponse = 'Пользователь с таким логином уже существует'
    } else {
      param.access_lvl = 0;
      param.pswd = bcrypt.hashSync(param.pswd, 13);
      const user = this.usersRepository.create(param);

      user.token = this.createNewToken(user.id, user.access_lvl);
      await this.usersRepository.save(user);

      sResponse = 'Пользователь создан';
    }

    return sResponse;
  }

  /**
   * Получить всех пользователей
   * TODO пока в БД мало данные - будет работать, потом добавить пагинацию
   */
  async listAllUser(): Promise<User[]> {
    return await this.usersRepository.find({});
  }

  /**
   * Обновить пароль пользователю
   */
  async updateUserPassword(param: updateUserPasswordDto): Promise<boolean> {
    const vUser = await this.usersRepository.findOneBy({ id: param.user_id });
    let isOk = false

    if (vUser) {

      const sNewPswd = bcrypt.hashSync(param.pswd, 13);

      const sNewToken = this.createNewToken(param.user_id, vUser.access_lvl);

      if (sNewToken) {

        const vUpdateResult = await this.usersRepository.update(param.user_id, { token: sNewToken, pswd: sNewPswd });
        if (vUpdateResult) {
          isOk = true;
        }
      }

    }

    return isOk;
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
}
