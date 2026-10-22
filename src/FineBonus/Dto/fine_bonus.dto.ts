import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { FineBonusType } from '../Entity/fine_bonus_type';

export class ListFineBonusDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?: string;

    @IsOptional()
    @IsEnum(FineBonusType)
    type?: FineBonusType;

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

export class CreateFineBonusDto {
    @IsString()
    @MaxLength(100)
    name: string;

    @IsEnum(FineBonusType)
    type: FineBonusType;
}

export class UpdateFineBonusDto {
    @IsInt()
    @Min(1)
    id: number;

    @IsString()
    @MaxLength(100)
    name: string;

    @IsEnum(FineBonusType)
    type: FineBonusType;
}

export class ListUserFineBonusDto {
    @IsOptional()
    @IsEnum(FineBonusType)
    type?: FineBonusType;

    @IsOptional()
    @IsInt()
    @Min(1)
    user_id?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    event_id?: number;

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

export class CreateUserFineBonusDto {
    @IsInt()
    @Min(1)
    event_id: number;

    @IsInt()
    @Min(1)
    work_shift_id: number;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    comment?: string;

    @IsInt()
    @Min(1)
    user_id: number;

    @IsEnum(FineBonusType)
    type: FineBonusType;
}

export class UpdateUserFineBonusDto extends CreateUserFineBonusDto {
    @IsInt()
    @Min(1)
    id: number;
}
