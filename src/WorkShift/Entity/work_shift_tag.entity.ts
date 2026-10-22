import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity()
@Unique(['work_shift_id', 'tag_id'])
export class WorkShiftTag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  work_shift_id: number;

  @Column()
  tag_id: number;
}
