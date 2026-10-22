import { TrimEnd } from 'src/common/trim-end';

/**
 * Тип для обновления инфы о пользователе
 */
export class UpdateUserInfoDto {
    user_id: number;

    name: string;

    surname: string;

    fathername: string;

    @TrimEnd()
    phone: string;

    curr_user?: number
}
