import { IsDateString, IsInt } from 'class-validator';
import { Entity, PrimaryGeneratedColumn, Column, Unique, Index } from 'typeorm';

@Entity()
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Unique('uniq_event_name', ['event_name'])
  @Index('event_name_indx')
  event_name: string;

  @Column()
  @IsInt()
  user_id: number;

  @Column({ default: '' })
  @IsInt()
  comment: string;

  @Column({ default: () => "CURRENT_TIMESTAMP" })
  @IsDateString()
  created_at: string;

  @Column({ default: () => 'on update current_timestamp()' })
  @IsDateString()
  updated_at: string;
}
