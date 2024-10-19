import { IsEmail, IsInt, isString, IsString, MaxLength, Min, MinLength, minLength } from "class-validator";

// Список уровней доступа дя пользователей
export enum AccessLevelT {
    root = 100, // рут всемогущий

    banned = -1, // забанен
    noob = 0, // регистрация не завершена
    registered = 1, // зарегистрирован
}

/**
 * Тип для регистрации пользователя
 */
export class UserCreateDto {
    @IsString()
    login: string;

    @IsString()
    pswd: string;

    @IsEmail()
    email: string;

    access_lvl?: number;
    token?: string;

}

/**
 * Тип для обновления токена пользователя
 */
export class RecreateUserTokenDto {
    @IsInt()
    @Min(1)
    user_id: number
}

/**
 * Тип для обновления пароля пользователя
 */
export class updateUserPasswordDto {
    is_ok: boolean;

    @IsString()
    @MinLength(6)
    @MaxLength(20)
    pswd: string;
}
