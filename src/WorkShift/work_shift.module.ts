import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessLevelT } from 'src/User/Dto/user.dto';
import { WorkShiftController } from './work_shift.controller';
import { WorkShiftService } from './work_shift.service';
import { faAuthSysMiddleware } from 'src/Middleware';
import { User } from 'src/User/Entity/user.entity';
import { WorkShift } from './Entity/work_shift.ts.entity';
import { WorkShiftUser } from './Entity/work_shift_user.entity';
import { WorkShiftTag } from './Entity/work_shift_tag.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, WorkShift, WorkShiftUser, WorkShiftTag])],
    controllers: [WorkShiftController],
    providers: [WorkShiftService],
})

export class WorkShiftModule {
    public configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(faAuthSysMiddleware(AccessLevelT.registered))
            .forRoutes('work-shift/list-work-shift', 'work-shift/suggest-shift-users');

        consumer
            .apply(faAuthSysMiddleware(AccessLevelT.brigadier))
            .forRoutes('work-shift/create-work-shift', 'work-shift/update-work-shift', 'work-shift/set-shift-tags');
    }
}

