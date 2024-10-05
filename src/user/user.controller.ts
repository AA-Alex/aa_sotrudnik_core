import { Controller, Post, Body, Get, ValidationPipe, Header, Req } from '@nestjs/common';
import { UsersService } from './user.service';
import { User } from './user.entity';
import { AccessLevelT, RecreateUserTokenDto, updateUserPasswordDto, UserCreateDto } from './user.dto';
import AuthSysMiddleware from 'src/Middleware';

@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  private authMiddleware = new AuthSysMiddleware();

  @Post('register')
  async create(@Req() request: Request, @Body(new ValidationPipe()) data: UserCreateDto,): Promise<string> {

    return this.usersService.create(data);
  }

  @Post('recreate-user-token')
  async recreateUserToken(@Req() request: Request, @Body(new ValidationPipe()) data: RecreateUserTokenDto): Promise<{ is_ok: boolean }> {

    const isOk = await this.usersService.recreateUserToken(data.user_id);
    return { is_ok: isOk };
  }

  @Post('update_user_password')
  async updateUserPassword(@Req() request: Request, @Body(new ValidationPipe()) data: updateUserPasswordDto): Promise<{ is_ok: boolean, error_message: string }> {
    let resp = { is_ok: false, error_message: 'ошибка доступа' };
    const vAccessCheck = await this.authMiddleware.AuthSysMiddleware(request, AccessLevelT.root);
    if (vAccessCheck.is_ok) {
      resp.is_ok = await this.usersService.updateUserPassword(data);
      resp.error_message = 'no error';

    }
    return resp;
  }

  @Post('list-all-user')
  async listAllUser(@Req() request: Request): Promise<{ list_user: User[], error_message: string }> {
    let resp = { list_user: [], error_message: 'ошибка доступа' };
    const vAccessCheck = await this.authMiddleware.AuthSysMiddleware(request)

    if (vAccessCheck.is_ok) {
      resp.list_user = await this.usersService.listAllUser();
      resp.error_message = 'no error';
    }

    return resp;
  }

}
