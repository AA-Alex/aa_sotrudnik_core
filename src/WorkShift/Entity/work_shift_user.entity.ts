import { IsDateString, IsInt } from 'class-validator';
import { Entity, PrimaryGeneratedColumn, Column, } from 'typeorm';

@Entity()
export class WorkShiftUser {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ comment: 'пользователь который вызван смену' })
  @IsInt()
  user_id?: number;

  @Column({ comment: 'id события из таблицы work_shift' })
  @IsInt()
  work_shift_id?: number;

  @Column({ default: () => "CURRENT_TIMESTAMP" })
  @IsDateString()
  created_at?: string;

  @Column({ default: () => 'on update current_timestamp()' })
  @IsDateString()
  updated_at?: string;
}
