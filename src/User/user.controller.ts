import { Controller, Post, Body, Get, ValidationPipe, Header, Req, Inject, forwardRef, HttpStatus, HttpCode } from '@nestjs/common';
import { UsersService } from './user.service';
import { AccessLevelT, RecreateUserTokenDto, updateUserPasswordDto, UserCreateDto } from './Dto/user.dto';
import { UpdateUserInfoDto } from './Dto/user_info.dto';
import { User } from './Entity/user.entity';
import { UserInfo } from './Entity/user_info.entity';

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
 * Получить данные текущего пользователя
 */
  @Post('get-self-info')
  @HttpCode(200)
  async getSelfInfo(): Promise<{ user: User, user_info: UserInfo }> {
    return this.usersService.getSelfInfo();
  }



  /**
 * Регистрация нового пользователя
 */
  @Post('register')
  @HttpCode(200)
  async register(@Req() request: Request, @Body(new ValidationPipe({ whitelist: true })) data: UserCreateDto,): Promise<{ token: string }> {

    return this.usersService.register(data);
  }

  /**
   * Авторизоваться по логину и паролю, получить токен
   */
  @Post('login')
  @HttpCode(200)
  async login(@Req() request: Request, @Body(new ValidationPipe({ whitelist: true })) data: UserCreateDto,): Promise<{ token: string }> {
    return this.usersService.logIn(data);
  }

  /**
 * Пересоздать токен авторизации
 */
  @Post('recreate-user-token')
  @HttpCode(200)
  async recreateUserToken(@Req() request: Request, @Body(new ValidationPipe({ whitelist: true })) data: RecreateUserTokenDto): Promise<{ is_ok: boolean }> {

    const isOk = await this.usersService.recreateUserToken(data.user_id);
    return { is_ok: isOk };
  }

  /**
   * Обновить пароль текущего пользователя
   */
  @Post('update-user-password')
  @HttpCode(200)
  async updateUserPassword(@Req() request: Request, @Body(new ValidationPipe({ whitelist: true })) data: updateUserPasswordDto): Promise<{ is_ok: boolean, message: string, token: string }> {

    return await this.usersService.updateUserPassword(data);
  }

  /**
 * Обновить инфо о пользователе
 */
  @Post('update-user-info')
  @HttpCode(200)
  async updateUserInfo(@Req() request: Request, @Body(new ValidationPipe({ whitelist: true })) data: UpdateUserInfoDto): Promise<{ is_ok: boolean, message: string }> {

    return await this.usersService.updateUserInfo(data);
  }


}
