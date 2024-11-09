import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessLevelT } from 'src/User/Dto/user.dto';
import { User } from 'src/User/Entity/user.entity';
import { UserInfo } from 'src/User/Entity/user_info.entity';
import { AdminUsersService } from './admin-user.service';
import { AdminUsersController } from './admin-user.controller';
import { faAuthSysMiddleware } from 'src/Middleware';

@Module({
    imports: [TypeOrmModule.forFeature([User, UserInfo,])],
    controllers: [AdminUsersController],
    providers: [AdminUsersService],
})

export class AdminUserModule {
    public configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(faAuthSysMiddleware(AccessLevelT.admin))
            .forRoutes('admin-user/list-user', 'admin-user/create-user', 'admin-user/update-user');
    }
}
