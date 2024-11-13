import { Entity, PrimaryGeneratedColumn, Column, Unique, Index } from 'typeorm';

@Entity()
@Unique(['user_id', 'tag_id'])
export class UserTag {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  tag_id: number
}
