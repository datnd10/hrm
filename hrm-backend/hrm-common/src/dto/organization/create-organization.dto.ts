import { IsString, IsNotEmpty, Length } from 'class-validator';
// Đảm bảo rằng bạn import đúng entity

export class CreateOrganizationDto {
    @IsString()
    @IsNotEmpty({ message: 'Organization name should not be empty' })
    @Length(1, 255, { message: 'Organization name should be between 1 and 255 characters' })
    organizationName: string;
}