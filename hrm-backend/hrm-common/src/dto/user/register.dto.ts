import { IsEmail, IsNotEmpty, IsString, Length, Matches, MaxLength } from "class-validator";

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    @Length(8, 255, { message: 'Password name should be between 8 and 255 characters' })
    @Matches(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)/, {
        message: 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character',
    })
    password: string;

    @IsString()
    @IsNotEmpty({ message: 'Organization name should not be empty' })
    @Length(3, 255, { message: 'Organization name should be between 3 and 255 characters' })
    organizationName: string;
}
