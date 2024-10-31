import { IsDateString, IsInt } from 'class-validator';
import { Entity, PrimaryGeneratedColumn, Column, Unique, Index } from 'typeorm';

@Entity()
export class Tag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Unique('uniq_tag_name', ['tag_name'])
  @Index('tag_name_indx')
  tag_name: string;

  @Column()
  @IsInt()
  user_id: number;

  @Column({ default: () => "CURRENT_TIMESTAMP" })
  @IsDateString()
  created_at: string;

  @Column({ default: () => 'on update current_timestamp()' })
  @IsDateString()
  updated_at: string;
}
