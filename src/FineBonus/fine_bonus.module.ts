import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { faAuthSysMiddleware } from 'src/Middleware';
import { AccessLevelT } from 'src/User/Dto/user.dto';
import { User } from 'src/User/Entity/user.entity';
import { FineAndBonus } from './Entity/fine_and_bonus.entity';
import { UserFineBonus } from './Entity/user_fine_bonus.entity';
import { FineBonusController } from './fine_bonus.controller';
import { FineBonusService } from './fine_bonus.service';

@Module({
  imports: [TypeOrmModule.forFeature([FineAndBonus, UserFineBonus, User])],
  controllers: [FineBonusController],
  providers: [FineBonusService],
})
export class FineBonusModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(faAuthSysMiddleware(AccessLevelT.brigadier))
      .forRoutes(
        'fine-bonus/list-fine-bonus',
        'fine-bonus/list-all-fine-bonus',
        'fine-bonus/create-fine-bonus',
        'fine-bonus/update-fine-bonus',
        'fine-bonus/list-user-fine-bonus',
        'fine-bonus/create-user-fine-bonus',
        'fine-bonus/update-user-fine-bonus',
      );
  }
}
