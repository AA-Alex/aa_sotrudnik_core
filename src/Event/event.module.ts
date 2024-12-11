import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { faAuthSysMiddleware } from 'src/Middleware';
import { Tag } from 'src/Tag/Entity/tag.entity';
import { AccessLevelT } from 'src/User/Dto/user.dto';
import { User } from 'src/User/Entity/user.entity';
import { UserInfo } from 'src/User/Entity/user_info.entity';
import { EventController } from './event.controller';
import { EventService } from './event.service';

@Module({})
export class EventModule {}

@Module({
    imports: [TypeOrmModule.forFeature([Tag, User, UserInfo])], // Зачем тут User и UserInfo не понятно, но нест далбаёб без этого ломается.
    controllers: [EventController],
    providers: [EventService],
})

export class TagModule {
    public configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(faAuthSysMiddleware(AccessLevelT.boss))
            .forRoutes('event/list-event', 'event/create-event', 'event/update-event');
    }
}
