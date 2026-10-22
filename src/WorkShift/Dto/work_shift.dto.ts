import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, MaxLength, IsArray, Max, IsEnum, Min } from "class-validator";
import { WorkShiftStatus } from '../Entity/work_shift.ts.entity';

/**
 * Тип для получения смен
 */
export class WorkShiftDTO {
    @IsInt()
    id?: number;

    @IsString()
    comment?: string;

    @IsInt()
    user_id?: number;

    @IsInt()
    master_user_id?: number;

    @IsEnum(WorkShiftStatus)
    status?: WorkShiftStatus;

    @IsInt()
    event_id?: number;

    @IsDateString()
    call_date_start?: string;

    @IsDateString()
    call_date_end?: string;

    @IsDateString()
    created_at?: string;

    @IsDateString()
    updated_at?: string;

    @IsArray()
    list_user_id?: number[];

    @IsOptional()
    @IsInt()
    @Min(0)
    page?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(30)
    limit_page?: number;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    search_event?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    search_user?: string;

    @IsOptional()
    @IsInt()
    access_lvl?: number;

    @IsOptional()
    @IsIn(['created_at', 'event_name', 'access_lvl'])
    sort?: 'created_at' | 'event_name' | 'access_lvl';

    @IsOptional()
    @IsBoolean()
    sort_desc?: boolean;
}

/**
 * Подсказки сотрудников для фильтра смен
 */
export class SuggestShiftUserDto {
    @IsString()
    @MaxLength(100)
    search: string;

    @IsOptional()
    @IsInt()
    access_lvl?: number;
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
    master_user_id?: number;

    @IsEnum(WorkShiftStatus)
    status?: WorkShiftStatus;

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
    @IsInt()
    shift_id: number;

    @IsString()
    comment?: string;

    @IsInt()
    @MaxLength(7)
    user_id?: number;

    @IsInt()
    @MaxLength(7)
    master_user_id?: number;

    @IsEnum(WorkShiftStatus)
    status?: WorkShiftStatus;

    @IsInt()
    @MaxLength(7)
    event_id?: number;

    @IsDateString()
    call_date_start?: string;

    @IsDateString()
    call_date_end?: string;

    @IsArray()
    list_user_id?: number[];
}

