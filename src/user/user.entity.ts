import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Unique('uniq_login', ['login'])
  login: string;

  @Column()
  pswd: string;

  @Column({ nullable: true })
  token: string;

  @Column({ nullable: true })
  access_lvl?: number;

}
