import { Controller, Post, Body, Get, ValidationPipe, Header, Req, Inject, forwardRef, HttpStatus, HttpCode } from '@nestjs/common';
import { UsersService } from './user.service';
import { AccessLevelT, RecreateUserTokenDto, updateUserPasswordDto, UserCreateDto } from './Dto/user.dto';
import { UpdateUserInfoDto } from './Dto/user_info.dto';
import { UpdateSelfEmailDto, UpdateSelfPasswordDto, UpdateSelfPhoneDto } from './Dto/user_self.dto';
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
  async getSelfInfo(@Req() request: Request, @Body() data: any): Promise<{ user: User, user_info: UserInfo }> {
    return this.usersService.getSelfInfo(data);
  }

  /**
   * Ближайшие и завершённые смены и штрафы текущего пользователя
   */
  @Post('my-home')
  @HttpCode(200)
  async getMyHome(@Body() data: any) {
    return this.usersService.getMyHome(data);
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

    return await this.usersService.updateUserPassword(data, request.body);
  }

  /**
 * Обновить инфо о пользователе
 */
  @Post('update-user-info')
  @HttpCode(200)
  async updateUserInfo(@Req() request: Request, @Body(new ValidationPipe({ whitelist: true })) data: UpdateUserInfoDto): Promise<{ is_ok: boolean, message: string }> {

    return await this.usersService.updateUserInfo(data, request.body);
  }

  @Post('update-self-phone')
  @HttpCode(200)
  async updateSelfPhone(@Req() request: Request, @Body(new ValidationPipe({ whitelist: true })) data: UpdateSelfPhoneDto): Promise<{ is_ok: boolean }> {
    return await this.usersService.updateSelfPhone(data, request.body);
  }

  @Post('update-self-email')
  @HttpCode(200)
  async updateSelfEmail(@Req() request: Request, @Body(new ValidationPipe({ whitelist: true })) data: UpdateSelfEmailDto): Promise<{ is_ok: boolean }> {
    return await this.usersService.updateSelfEmail(data, request.body);
  }

  @Post('update-self-password')
  @HttpCode(200)
  async updateSelfPassword(@Req() request: Request, @Body(new ValidationPipe({ whitelist: true })) data: UpdateSelfPasswordDto): Promise<{ is_ok: boolean, token: string }> {
    return await this.usersService.updateSelfPassword(data, request.body);
  }


}
