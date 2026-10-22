import { IsDateString, IsEnum, IsString } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { FineBonusType } from './fine_bonus_type';

@Entity()
export class FineAndBonus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsString()
  name: string;

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
