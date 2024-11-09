import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessLevelT } from 'src/User/Dto/user.dto';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';
import { Tag } from 'src/Tag/Entity/tag.entity';
import { faAuthSysMiddleware } from 'src/Middleware';
import { User } from 'src/User/Entity/user.entity';
import { UserInfo } from 'src/User/Entity/user_info.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Tag, User, UserInfo])], // Зачем тут User и UserInfo не понятно, но нест далбаёб без этого ломается.
    controllers: [TagController],
    providers: [TagService],
})

export class TagModule {
    public configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(faAuthSysMiddleware(AccessLevelT.boss))
            .forRoutes('tag/list-tag', 'tag/create-tag', 'tag/update-tag');
    }
}
