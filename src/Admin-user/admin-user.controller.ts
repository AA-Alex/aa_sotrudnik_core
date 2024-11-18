import { Controller, Post, Body, Get, ValidationPipe, Header, Req, Inject, forwardRef, HttpCode } from '@nestjs/common';
import { AdminUsersService } from './admin-user.service';
import { UserTagDto, CreateUserByAdminDto, ListUserDto, UpdateUserByAdminDto } from './Dto/admin-user.dto';
import { User } from 'src/User/Entity/user.entity';
import { UserInfo } from 'src/User/Entity/user_info.entity';

@Controller('admin-user')
export class AdminUsersController {
  constructor(
    private readonly adminUsersService: AdminUsersService,

  ) {}

  /**
   * Получить данные пользователей (с фильтром и пагинацией)
   */
  @Post('list-user')
  @HttpCode(200)
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
  @HttpCode(200)
  async createUserByAdmin(@Req() request: Request, @Body(new ValidationPipe({ whitelist: true })) data: CreateUserByAdminDto,): Promise<{ user: User, user_info: UserInfo }> {

    return await this.adminUsersService.createUser(data);
  }

  /**
  * Обновить пользователя
  */
  @Post('update-user')
  @HttpCode(200)
  async updateUserByAdmin(@Req() request: Request, @Body(
    new ValidationPipe({ skipMissingProperties: true, whitelist: true })
  ) data: UpdateUserByAdminDto,): Promise<{ is_ok: boolean, message: string }> {

    return await this.adminUsersService.updateUserInfo(data);
  }

  /**
  * Добавить тег сотруднику
  */
  @Post('add-user-tag')
  @HttpCode(200)
  async addUserTag(@Req() request: Request, @Body(new ValidationPipe({ whitelist: true })) data: UserTagDto,): Promise<string> {

    return await this.adminUsersService.addUserTag(data);
  }

  /**
  * Удалить тег у сотрудника
  */
  @Post('del-user-tag')
  @HttpCode(200)
  async delUserTag(@Req() request: Request, @Body(new ValidationPipe({ whitelist: true })) data: UserTagDto,): Promise<string> {

    return await this.adminUsersService.delUserTag(data);
  }

}
