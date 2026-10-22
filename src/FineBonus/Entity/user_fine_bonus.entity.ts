import { IsDateString, IsEnum, IsInt, IsString } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { FineBonusType } from './fine_bonus_type';

@Entity()
export class UserFineBonus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: 'id события из таблицы event' })
  @IsInt()
  event_id: number;

  @Column({ comment: 'id смены, на которой выдали штраф или бонус' })
  @IsInt()
  work_shift_id: number;

  @Column({ default: '' })
  @IsString()
  comment: string;

  @Column({ comment: 'сотрудник, который получил штраф или бонус' })
  @IsInt()
  user_id: number;

  @Column({ comment: 'пользователь, который добавил штраф или бонус' })
  @IsInt()
  user_who_changed: number;

  @Column({
    type: 'enum',
    enum: FineBonusType,
    enumName: 'fine_bonus_type',
  })
  @IsEnum(FineBonusType)
  type: FineBonusType;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  @IsDateString()
  created_at: string;

  @Column({ default: () => 'on update current_timestamp()' })
  @IsDateString()
  updated_at: string;
}
