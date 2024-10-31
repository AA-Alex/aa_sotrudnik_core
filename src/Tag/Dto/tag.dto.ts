import { IsInt, IsString, Max, MaxLength, Min, } from "class-validator";

/**
 * Тип для получения тегов
 */
export class ListTagDto {
    @IsString()
    @MaxLength(20)
    tag_name: string;

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
 * Тип для создания тега
 */
export class CreateTagDto {
    @IsString()
    @MaxLength(20)
    tag_name: string;
}

/**
 * Тип для обновления тега
 */
export class UpdateTagDto {
    @IsInt()
    @Min(1)
    tag_id: number

    @IsString()
    @MaxLength(20)
    tag_name: string;
}

