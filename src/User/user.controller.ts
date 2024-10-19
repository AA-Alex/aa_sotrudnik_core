import { Controller, Post, Body, Get, ValidationPipe, Header, Req, Inject, forwardRef } from '@nestjs/common';
import { UsersService } from './user.service';
import { User } from './Entity/user.entity';
import { AccessLevelT, RecreateUserTokenDto, updateUserPasswordDto, UserCreateDto } from './Dto/user.dto';

@Controller('user')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,

  ) {}

  @Post('create-root-user')
  async createRootUser(): Promise<string> {

    return this.usersService.createRootUser();
  }

  @Post('register')
  async register(@Req() request: Request, @Body(new ValidationPipe()) data: UserCreateDto,): Promise<string> {

    return this.usersService.register(data);
  }

  @Post('login')
  async login(@Req() request: Request, @Body(new ValidationPipe()) data: UserCreateDto,): Promise<string> {

    return this.usersService.logIn(data);
  }

  @Post('recreate-user-token')
  async recreateUserToken(@Req() request: Request, @Body(new ValidationPipe()) data: RecreateUserTokenDto): Promise<{ is_ok: boolean }> {

    const isOk = await this.usersService.recreateUserToken(data.user_id);
    return { is_ok: isOk };
  }

  @Post('update-user-password')
  async updateUserPassword(@Req() request: Request, @Body(new ValidationPipe()) data: updateUserPasswordDto): Promise<{ is_ok: boolean, message: string, token: string }> {

    return await this.usersService.updateUserPassword(data);
  }


}
