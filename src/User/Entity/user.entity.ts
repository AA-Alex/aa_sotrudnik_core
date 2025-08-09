import { IsDateString } from 'class-validator';
import { Entity, PrimaryGeneratedColumn, Column, Unique, Index } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Unique('uniq_login', ['login'])
  login: string;

  @Column({ nullable: true })
  @Unique('uniq_email', ['email'])
  email: string;

  @Column()
  @Index('pswd')
  pswd: string;

  @Column({ nullable: true })
  token: string;

  @Column({ nullable: true })
  access_lvl?: number;


  @Column({ default: () => "CURRENT_TIMESTAMP" })
  @IsDateString()
  created_at: string;

  @Column({ default: () => 'on update current_timestamp()' })
  @IsDateString()
  updated_at: string;

}
