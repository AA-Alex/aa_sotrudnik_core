import { IsInt, IsString, Max, MaxLength, Min, } from "class-validator";

/**
 * Тип для получения событий
 */
export class ListEventDto {
    @IsString()
    @MaxLength(20)
    event_name: string;

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
 * Тип для создания события
 */
export class CreateEventDto {
    @IsString()
    @MaxLength(20)
    event_name: string;

    @IsString()
    @MaxLength(50)
    comment?: string;

    curr_user?: number
}

/**
 * Тип для обновления события
 */
export class UpdateEventDto {
    @IsInt()
    @Min(1)
    event_id: number

    @IsString()
    @MaxLength(20)
    event_name: string;

    curr_user?: number
}

