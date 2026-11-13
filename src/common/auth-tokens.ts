import { Repository } from 'typeorm';
import { UserAuthToken } from '../User/Entity/user_auth_token.entity';

/** Сколько устройств могут быть авторизованы одновременно. */
export const MAX_AUTH_TOKENS = 3;

/**
 * Условие в БД: перед вставкой четвёртого токена удаляется самый старый.
 * После вставки у пользователя остаётся не больше трёх строк.
 */
export async function ensureAuthTokenLimit(repo: Repository<UserAuthToken>): Promise<void> {
  const keep = MAX_AUTH_TOKENS - 1;
  await repo.query(`
    CREATE OR REPLACE FUNCTION user_auth_token_keep_three()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      PERFORM id
      FROM user_auth_token
      WHERE user_id = NEW.user_id
      ORDER BY id
      FOR UPDATE;

      DELETE FROM user_auth_token
      WHERE id IN (
        SELECT id
        FROM user_auth_token
        WHERE user_id = NEW.user_id
        ORDER BY created_at ASC, id ASC
        LIMIT GREATEST(
          (SELECT COUNT(*) FROM user_auth_token WHERE user_id = NEW.user_id) - ${keep},
          0
        )
      );

      RETURN NEW;
    END;
    $$;
  `);
  await repo.query(`DROP TRIGGER IF EXISTS user_auth_token_max_three ON user_auth_token`);
  await repo.query(`
    CREATE TRIGGER user_auth_token_max_three
    BEFORE INSERT ON user_auth_token
    FOR EACH ROW
    EXECUTE FUNCTION user_auth_token_keep_three()
  `);
  await repo.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_auth_token_user'
      ) THEN
        ALTER TABLE user_auth_token
          ADD CONSTRAINT fk_user_auth_token_user
          FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
      END IF;
    END $$;
  `);
}

/** Новый вход. Триггер сам снимает самый старый токен, если их уже три. */
export async function addAuthToken(repo: Repository<UserAuthToken>, userId: number, token: string): Promise<void> {
  await repo.query(
    `INSERT INTO user_auth_token (user_id, token) VALUES ($1, $2)`,
    [userId, token],
  );
}

/** Смена пароля или прав гасит прежние входы и оставляет один новый токен. */
export async function replaceAuthTokens(repo: Repository<UserAuthToken>, userId: number, token: string): Promise<void> {
  await repo.query(`DELETE FROM user_auth_token WHERE user_id = $1`, [userId]);
  await addAuthToken(repo, userId, token);
}
