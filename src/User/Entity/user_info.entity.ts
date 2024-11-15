import { Entity, PrimaryGeneratedColumn, Column, Unique, Index } from 'typeorm';

@Entity()
export class UserInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Unique('uniq_user_id', ['user_id'])
  user_id: number;

  @Column()
  @Unique('uniq_dispaly_name', ['dispaly_name'])
  @Index()
  display_name: string;

  @Column({ default: '' })
  @Index()
  name: string;

  @Column({ default: '' })
  @Index()
  surname: string;

  @Column({ default: '' })
  @Index()
  fathername: string;

  @Column({ default: '' })
  @Index()
  phone: string;

}
