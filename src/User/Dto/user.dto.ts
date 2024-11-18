import { IsEmail, IsInt, IsNumber, isString, IsString, MaxLength, Min, MinLength, minLength } from "class-validator";

// Список уровней доступа дя пользователей
export enum AccessLevelT {
    root = 100,                 // рут всемогущий
    admin = 90,                 // админ, почти как рут но с минимальными ограничениями

    boss = 50,                  // начальник цеха
    brigadier = 40,             // Бригадир

    noob = 0, // регистрация не завершена
    registered = 1, // зарегистрирован
    banned = -1, // забанен
}

/**
 * Тип для обновления инфы о пользователе
 */
export class UserDto {
    @IsNumber()
    id?: number;

    @IsString()
    login?: string;

    @IsEmail()
    email?: string;

    @IsString()
    pswd?: string;

    @IsString()
    token?: string;

    @IsString()
    access_lvl?: number;
}

/**
 * Тип для регистрации пользователя
 */
export class UserCreateDto {
    @IsString()
    login: string;

    @IsEmail()
    email: string;

    @IsString()
    pswd: string;


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
