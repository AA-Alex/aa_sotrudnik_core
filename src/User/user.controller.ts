import { Controller, Post, Body, Get, ValidationPipe, Header, Req, Inject, forwardRef } from '@nestjs/common';
import { UsersService } from './user.service';
import { AccessLevelT, RecreateUserTokenDto, updateUserPasswordDto, UserCreateDto } from './Dto/user.dto';
import { UpdateUserInfoDto } from './Dto/user_info.dto';

@Controller('user')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,

  ) {}

  /**
   * Создать рут пользователя (однократно)
   */
  @Post('create-root-user')
  async createRootUser(): Promise<string> {

    return this.usersService.createRootUser();
  }

  /**
 * Регистрация нового пользователя
 */
  @Post('register')
  async register(@Req() request: Request, @Body(new ValidationPipe({ whitelist: true })) data: UserCreateDto,): Promise<string> {

    return this.usersService.register(data);
  }

  /**
   * Авторизоваться по логину и паролю, получить токен
   */
  @Post('login')
  async login(@Req() request: Request, @Body(new ValidationPipe({ whitelist: true })) data: UserCreateDto,): Promise<string> {

    return this.usersService.logIn(data);
  }

  /**
 * Пересоздать токен авторизации
 */
  @Post('recreate-user-token')
  async recreateUserToken(@Req() request: Request, @Body(new ValidationPipe({ whitelist: true })) data: RecreateUserTokenDto): Promise<{ is_ok: boolean }> {

    const isOk = await this.usersService.recreateUserToken(data.user_id);
    return { is_ok: isOk };
  }

  /**
   * Обновить пароль текущего пользователя
   */
  @Post('update-user-password')
  async updateUserPassword(@Req() request: Request, @Body(new ValidationPipe({ whitelist: true })) data: updateUserPasswordDto): Promise<{ is_ok: boolean, message: string, token: string }> {

    return await this.usersService.updateUserPassword(data);
  }

  /**
 * Обновить инфо о пользователе
 */
  @Post('update-user-info')
  async updateUserInfo(@Req() request: Request, @Body(new ValidationPipe({ whitelist: true })) data: UpdateUserInfoDto): Promise<{ is_ok: boolean, message: string }> {

    return await this.usersService.updateUserInfo(data);
  }


}
