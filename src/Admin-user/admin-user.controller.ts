import { Controller, Post, Body, Get, ValidationPipe, Header, Req, Inject, forwardRef } from '@nestjs/common';
import { AdminUsersService } from './admin-user.service';
import { CreateUserByAdminDto, ListUserDto, UpdateUserByAdminDto } from './Dto/admin-user.dto';

@Controller('admin-user')
export class AdminUsersController {
  constructor(
    private readonly adminUsersService: AdminUsersService,

  ) {}

  /**
   * Получить данные пользователей (с фильтром и пагинацией)
   */
  @Post('list-user')
  async register(@Req() request: Request, @Body(new ValidationPipe({ skipMissingProperties: true, whitelist: true })) data: ListUserDto,): Promise<{
    user_id: number,
    login: string,
    access_lvl: number,
    email: string,
    display_name: string,
    name: string,
    fathername: string,
    phone: string
  }[]> {

    return await this.adminUsersService.listUser(data);
  }

  /**
  * Создать пользователя
  */
  @Post('create-user')
  async createUserByAdmin(@Req() request: Request, @Body(new ValidationPipe({ whitelist: true })) data: CreateUserByAdminDto,): Promise<string> {

    return await this.adminUsersService.createUser(data);
  }

  /**
  * Обновить пользователя
  */
  @Post('update-user')
  async updateUserByAdmin(@Req() request: Request, @Body(
    new ValidationPipe({ skipMissingProperties: true, whitelist: true })
  ) data: UpdateUserByAdminDto,): Promise<{ is_ok: boolean, message: string }> {

    return await this.adminUsersService.updateUserInfo(data);
  }


}
