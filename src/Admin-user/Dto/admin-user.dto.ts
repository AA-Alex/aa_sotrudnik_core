import { IsEmail, IsInt, isString, IsString, Max, MaxLength, Min, MinLength, minLength } from "class-validator";

/**
 * Тип для получения данных пользователей для админа
 */
export class ListUserDto {
    @IsString()
    @MaxLength(20)
    login: string;

    @IsEmail()
    @MaxLength(20)
    email: string;

    @IsString()
    @MaxLength(20)
    soname: string;

    @IsString()
    @MaxLength(20)
    display_name: string;

    @IsString()
    @MaxLength(20)
    name: string;

    @IsString()
    @MaxLength(20)
    phone: string;

    @IsString()
    @MaxLength(20)
    fathername: string;

    @IsInt()
    @MaxLength(7)
    user_id: number;

    @IsInt()
    @Max(10)
    page: number;

    @IsInt()
    @Max(30)
    limit_page: number;
}

/**
 * Тип для ручного создания пользователя админом
 */
export class CreateUserByAdminDto {
    @IsString()
    @MaxLength(20)
    @MinLength(3)
    login: string;

    @IsString()
    @MaxLength(20)
    @MinLength(6)
    pswd: string;

    @IsString()
    @MaxLength(20)
    @MinLength(3)
    name: string;

    @IsString()
    @MaxLength(20)
    @MinLength(3)
    soname: string;
}

/**
 * Тип для обновления пользователя админом
 */
export class UpdateUserByAdminDto {
    @IsInt()
    @Min(1)
    user_id: number

    @IsString()
    @MaxLength(20)
    @MinLength(3)
    login: string;

    @IsString()
    @MaxLength(20)
    @MinLength(6)
    pswd: string;

    @IsString()
    @MaxLength(20)
    @MinLength(3)
    name: string;

    @IsString()
    @MaxLength(20)
    @MinLength(3)
    soname: string;

    @IsString()
    @MaxLength(20)
    @MinLength(3)
    fathername: string;

    @IsEmail()
    email: string;

    @IsString()
    @MaxLength(13)
    @MinLength(9)
    phone: string;

    @IsInt()
    @Max(50)
    access_lvl: number;

    @IsString()
    @MaxLength(20)
    display_name: string;
}

