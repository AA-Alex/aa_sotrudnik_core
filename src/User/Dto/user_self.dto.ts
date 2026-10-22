import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { TrimEnd } from 'src/common/trim-end';

export class UpdateSelfPhoneDto {
    @TrimEnd()
    @IsString()
    @Matches(/^\+?[0-9]{9,13}$/)
    phone: string;

    @TrimEnd()
    @IsString()
    @Matches(/^\+?[0-9]{9,13}$/)
    phone_repeat: string;
}

export class UpdateSelfEmailDto {
    @TrimEnd()
    @IsEmail()
    @MaxLength(100)
    email: string;

    @TrimEnd()
    @IsEmail()
    @MaxLength(100)
    email_repeat: string;
}

export class UpdateSelfPasswordDto {
    @TrimEnd()
    @IsString()
    @MinLength(6)
    @MaxLength(20)
    pswd: string;

    @TrimEnd()
    @IsString()
    @MinLength(6)
    @MaxLength(20)
    pswd_repeat: string;
}
