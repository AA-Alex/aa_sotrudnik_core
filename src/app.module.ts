import { forwardRef, MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './User/Entity/user.entity';
import { UserModule } from './User/user.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserInfo } from './User/Entity/user_info.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'alex',
      password: '123',
      database: 'postgres',
      entities: [User, UserInfo],
      synchronize: true,
    }),

    UserModule
  ],
  controllers: [AppController],
  providers: [AppService],

})
export class AppModule {
}
