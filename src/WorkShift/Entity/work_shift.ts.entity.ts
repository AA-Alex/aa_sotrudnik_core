import { IsDateString, IsInt, IsString, IsEnum } from 'class-validator';
import { Entity, PrimaryGeneratedColumn, Column, Index, } from 'typeorm';

export enum WorkShiftStatus {
  enable = 'enable',
  disable = 'disable',
  correction = 'correction',
}

@Entity()
export class WorkShift {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ comment: 'дата вызова на смену' })
  @IsDateString()
  @Index('call_date_start_indx')
  call_date_start?: string;

  @Column({ comment: 'дата окончания смены', nullable: true })
  @IsDateString()
  @Index('call_date_end_indx')
  call_date_end?: string;

  @Column({ comment: 'пользователь который создал смену' })
  @IsInt()
  user_id?: number;

  @Column({ comment: 'Старший смены', nullable: true })
  @IsInt()
  master_user_id?: number;

  @Column({ comment: 'id события из таблицы event' })
  @IsInt()
  event_id?: number;

  @Column({ comment: 'Не обязательный комментарий к смене', default: '' })
  @IsString()
  comment?: string;

  @Column({
    type: 'enum',
    enum: WorkShiftStatus,
    default: WorkShiftStatus.enable,
    comment: 'Статус смены',
  })
  @IsEnum(WorkShiftStatus)
  status?: WorkShiftStatus;



  @Column({ default: () => "CURRENT_TIMESTAMP" })
  @IsDateString()
  created_at?: string;

  @Column({ default: () => 'on update current_timestamp()' })
  @IsDateString()
  updated_at?: string;
}
