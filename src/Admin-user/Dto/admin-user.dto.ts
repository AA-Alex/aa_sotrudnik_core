import { IsArray, IsBoolean, IsEmail, IsIn, IsInt, IsOptional, isString, IsString, Max, MaxLength, Min, MinLength, minLength, ValidateIf } from "class-validator";

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
    surname: string;

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
    surname: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    access_lvl?: number;
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

    @IsOptional()
    @ValidateIf((dto) => !!dto.pswd)
    @IsString()
    @MaxLength(20)
    @MinLength(6)
    pswd?: string;

    @IsString()
    @MaxLength(20)
    @MinLength(3)
    name: string;

    @IsString()
    @MaxLength(20)
    @MinLength(3)
    surname: string;

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
    @Min(1)
    @Max(100)
    access_lvl: number;

    @IsString()
    @MaxLength(20)
    display_name: string;
}


/**
 * Поиск сотрудников для вызова на смену
 */
export class ListActiveUsersDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    search?: string;

    @IsOptional()
    @IsInt()
    access_lvl?: number;

    @IsOptional()
    @IsIn(['created_at', 'display_name', 'access_lvl'])
    sort?: 'created_at' | 'display_name' | 'access_lvl';

    @IsOptional()
    @IsBoolean()
    sort_desc?: boolean;

    @IsOptional()
    @IsInt()
    @Min(0)
    page?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(30)
    limit_page?: number;
}

/**
 * Тип для добавления тега пользователю
 */
export class UserTagDto {
    @IsInt()
    @Min(1)
    user_id: number

    @IsInt()
    @Min(1)
    tag_id: number

}

/**
 * Набор тегов сотрудника
 */
export class SetUserTagsDto {
    @IsInt()
    @Min(1)
    user_id: number;

    @IsArray()
    @IsInt({ each: true })
    tag_ids: number[];
}
