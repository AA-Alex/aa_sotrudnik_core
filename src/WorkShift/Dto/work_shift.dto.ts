import { IsDateString, IsInt, IsString, MaxLength, IsArray } from "class-validator";

/**
 * Тип для получения смен
 */
export class WorkShiftDTO {
    @IsInt()
    id: number;

    @IsString()
    comment?: string;

    @IsInt()
    user_id: number;

    @IsInt()
    event_id: number;

    @IsDateString()
    call_date_start: string;

    @IsDateString()
    call_date_end?: string;

    @IsDateString()
    created_at?: string;

    @IsDateString()
    updated_at?: string;

    @IsArray()
    list_user_id: number[];
}

/**
 * Тип для создания смены
 */
export class CreateWorkShiftDTO {
    @IsString()
    comment?: string;

    @IsInt()
    user_id?: number;

    @IsInt()
    event_id: number;

    @IsDateString()
    call_date_start: string;

    @IsDateString()
    call_date_end?: string;

    @IsArray()
    list_user_id: number[];

}

/**
 * Тип для обновления смены
 */
export class UpdateWorkShiftDTO {
    @IsString()
    comment?: string;

    @IsInt()
    @MaxLength(7)
    user_id: number;

    @IsInt()
    @MaxLength(7)
    event_id: number;

    @IsDateString()
    call_date_start: string;

    @IsDateString()
    call_date_end?: string;

    @IsArray()
    list_user_id?: number[];
}

