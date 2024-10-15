import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './user.controller';
import { UsersService } from './user.service';
import { User } from './user.entity';
import { faAuthSysMiddleware } from 'src/Middleware';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
})

export class UsersModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(faAuthSysMiddleware(100))
      .forRoutes('user/list-all-user');

    consumer
      .apply(faAuthSysMiddleware(0))
      .forRoutes('user/login');
  }

}


