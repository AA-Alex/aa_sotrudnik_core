import { forwardRef, MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './User/Entity/user.entity';
import { UserModule } from './User/user.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserInfo } from './User/Entity/user_info.entity';
import { AdminUserModule } from './Admin-user/admin-user.module';
import { TagModule } from './Tag/tag.module';
import { Tag } from './Tag/Entity/tag.entity';
import { Event } from './Event/Entity/event.entity';

import { dbConf } from './Config/Config';
import { UserTag } from './User/Entity/user_tag.entity';
import { EventTag } from './Event/Entity/event_tag.entity';
import { EventModule } from './Event/event.module';
import { WorkShiftModule } from './WorkShift/work_shift.module';
import { WorkShift } from './WorkShift/Entity/work_shift.ts.entity';
import { WorkShiftUser } from './WorkShift/Entity/work_shift_user.entity';
import { WorkShiftTag } from './WorkShift/Entity/work_shift_tag.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: dbConf.type,
      host: dbConf.host,
      port: dbConf.port,
      username: dbConf.username,
      password: dbConf.password,
      database: dbConf.database,
      entities: [User, UserInfo, Tag, UserTag, Event, EventTag, WorkShift, WorkShiftUser, WorkShiftTag],
      synchronize: true,
    }),

    UserModule,
    AdminUserModule,
    TagModule,
    EventModule,
    WorkShiftModule
  ],
  controllers: [AppController],
  providers: [AppService],

})
export class AppModule {
}
