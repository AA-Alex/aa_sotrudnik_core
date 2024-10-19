import { forwardRef, MiddlewareConsumer, Module, NestModule, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './user.controller';
import { UsersService } from './user.service';
import { User } from './Entity/user.entity';
import { UserInfo } from './Entity/user_info.entity';
import { faAuthSysMiddleware } from 'src/Middleware';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserInfo,])],
  controllers: [UsersController],
  providers: [UsersService],
})

export class UserModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(faAuthSysMiddleware(100))
      .forRoutes('user/list-all-user');

    consumer
      .apply(faAuthSysMiddleware(0))
      .forRoutes('user/login');

    consumer
      .apply(faAuthSysMiddleware(1))
      .forRoutes('user/update-user-password');

    consumer
      .apply(faAuthSysMiddleware(1))
      .forRoutes('user/update-user-info');
  }

}


