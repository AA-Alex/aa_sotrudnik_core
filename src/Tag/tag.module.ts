import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { faAuthSysMiddleware } from 'src/Middleware';
import { AccessLevelT } from 'src/User/Dto/user.dto';
import { User } from 'src/User/Entity/user.entity';
import { UserInfo } from 'src/User/Entity/user_info.entity';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';
import { Tag } from 'src/Tag/Entity/tag.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Tag])],
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
