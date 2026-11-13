import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

/** Отдельный вход. На пользователя их не больше трёх: лишнее снимает триггер в БД. */
@Entity('user_auth_token')
@Unique('uniq_user_auth_token', ['token'])
export class UserAuthToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index('idx_user_auth_token_user_id')
  user_id: number;

  @Column({ type: 'text' })
  token: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: string;
}
