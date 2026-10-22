import { Controller, Post, Body, Get, ValidationPipe, Header, Req, Inject, forwardRef, HttpCode } from '@nestjs/common';
import { AdminUsersService } from './admin-user.service';
import { UserTagDto, CreateUserByAdminDto, ListUserDto, UpdateUserByAdminDto, ListActiveUsersDto, SetUserTagsDto } from './Dto/admin-user.dto';
import { User } from 'src/User/Entity/user.entity';
import { UserInfo } from 'src/User/Entity/user_info.entity';
import { PaginationI } from 'src/main';

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
  async listUser(@Req() request: Request, @Body(new ValidationPipe({ skipMissingProperties: true, whitelist: true })) data: ListUserDto,): Promise<{
    list_user: {
      user_id: number,
      login: string,
      access_lvl: number,
      email: string,
      display_name: string,
      name: string,
      fathername: string,
      phone: string
    }[],
    pagination: PaginationI,
  }> {

    return await this.adminUsersService.listUser(data)
  }

  /**
  * Создать пользователя
  */
  @Post('create-user')
  @HttpCode(200)
  async createUserByAdmin(@Req() request: Request, @Body(new ValidationPipe({ whitelist: true, transform: true })) data: CreateUserByAdminDto,): Promise<{ user: User, user_info: UserInfo }> {

    return await this.adminUsersService.createUser(data, request.body);
  }

  /**
  * Обновить пользователя
  */
  @Post('update-user')
  @HttpCode(200)
  async updateUserByAdmin(@Req() request: Request, @Body(
    new ValidationPipe({ skipMissingProperties: true, whitelist: true, transform: true })
  ) data: UpdateUserByAdminDto,): Promise<{ is_ok: boolean, message: string }> {

    return await this.adminUsersService.updateUserInfo(data, request.body);
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

  /**
   * Заменить набор тегов сотрудника
   */
  @Post('set-user-tags')
  @HttpCode(200)
  async setUserTags(@Body(new ValidationPipe({ whitelist: true })) data: SetUserTagsDto,): Promise<{ is_ok: boolean }> {
    return await this.adminUsersService.setUserTags(data);
  }

  /**
  * Получить всех активных пользователей (для селектора смен)
  */
  @Post('list-active-users')
  @HttpCode(200)
  async listActiveUsers(@Body(new ValidationPipe({ skipMissingProperties: true, whitelist: true })) data: ListActiveUsersDto,): Promise<{
    list_user: {
      id: number,
      login: string,
      display_name: string,
      surname: string,
      name: string,
      access_lvl: number,
      created_at: string,
    }[],
    pagination: PaginationI,
  }> {

    return await this.adminUsersService.listActiveUsers(data);
  }

}
