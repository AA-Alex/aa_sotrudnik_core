import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessLevelT } from 'src/User/Dto/user.dto';
import { User } from 'src/User/Entity/user.entity';
import { UserInfo } from 'src/User/Entity/user_info.entity';
import { AdminUsersService } from './admin-user.service';
import { AdminUsersController } from './admin-user.controller';
import { faAuthSysMiddleware } from 'src/Middleware';
import { UserTag } from 'src/User/Entity/user_tag.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, UserInfo, UserTag])],
    controllers: [AdminUsersController],
    providers: [AdminUsersService],
})

export class AdminUserModule {
    public configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(faAuthSysMiddleware(AccessLevelT.admin))
            .forRoutes('admin-user/list-user', 'admin-user/create-user', 'admin-user/update-user');

        consumer
            .apply(faAuthSysMiddleware(AccessLevelT.brigadier))
            .forRoutes('admin-user/add-user-tag', 'admin-user/del-user-tag');
    }
}
