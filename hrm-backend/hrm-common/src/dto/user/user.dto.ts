import { Type } from "class-transformer";
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Length, Matches, MaxLength, Min } from "class-validator";

export class UserDto {
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

    @IsNotEmpty({ message: 'Quyền là bắt buộc.' })
    @Type(() => Number)
    @IsInt({ message: 'Quyền phải là số nguyên.' })
    @Min(1, { message: 'Quyền phải lớn hơn hoặc bằng 1.' })
    roleId: number;

    @IsInt({ message: 'Organization ID must be an integer.' })
    @Min(1, { message: 'Organization ID must be greater than 0.' })
    organizationId: number;
}
