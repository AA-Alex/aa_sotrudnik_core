import { Controller, Post, Body, Get, ValidationPipe, Header, Req, Inject, forwardRef } from '@nestjs/common';
import { AdminUsersService } from './admin-user.service';
import { ListUserDto } from './Dto/admin-user.dto';

@Controller('admin-user')
export class AdminUsersController {
  constructor(
    private readonly adminUsersService: AdminUsersService,

  ) {}

  /**
   * Получить данные пользователей (с фильтром и пагинацией)
   */
  @Post('list-user')
  async register(@Req() request: Request, @Body(new ValidationPipe({ skipMissingProperties: true })) data: ListUserDto,): Promise<{
    user_id: number,
    login: string,
    access_lvl: number,
    email: string,
    display_name: string,
    name: string,
    fathername: string,
    phone: string
  }[]> {

    return this.adminUsersService.listUser(data);
  }


}
