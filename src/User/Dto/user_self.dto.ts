import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateSelfPhoneDto {
    @IsString()
    @Matches(/^\+?[0-9]{9,13}$/)
    phone: string;

    @IsString()
    @Matches(/^\+?[0-9]{9,13}$/)
    phone_repeat: string;
}

export class UpdateSelfEmailDto {
    @IsEmail()
    @MaxLength(100)
    email: string;

    @IsEmail()
    @MaxLength(100)
    email_repeat: string;
}

export class UpdateSelfPasswordDto {
    @IsString()
    @MinLength(6)
    @MaxLength(20)
    pswd: string;

    @IsString()
    @MinLength(6)
    @MaxLength(20)
    pswd_repeat: string;
}
