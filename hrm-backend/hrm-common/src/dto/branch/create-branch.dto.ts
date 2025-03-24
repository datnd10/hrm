import { IsString, IsNotEmpty, IsPhoneNumber, IsEmail, Length, Matches, IsOptional } from 'class-validator';

export class CreateBranchDto {
    @IsString()
    @Length(2, 100, {
        message: 'Tên chi nhánh phải trong khoảng từ 2 đến 100 ký tự.',
    })
    @IsNotEmpty({ message: 'Tên chi nhánh là bắt buộc.' })
    branchName: string;

    @IsOptional()  // Bổ sung IsOptional cho các trường không bắt buộc
    @IsString()
    @Length(3, 100, {
        message: 'Tỉnh/Thành Phố phải trong khoảng từ 3 đến 100 ký tự.'
    })
    province?: string;

    @IsOptional()
    @IsString()
    @Length(2, 100, {
        message: 'Quận/Huyện phải trong khoảng từ 2 đến 100 ký tự.'
    })
    district?: string;

    @IsOptional()
    @IsString()
    @Length(2, 100, {
        message: 'Phường Xã phải trong khoảng tu 2 đến 100 ký tự.'
    })
    ward?: string;

    @IsOptional()
    @IsString()
    @Length(2, 200, {
        message: 'Đị̣a chỉ chi tiết phải trong khoảng từ 2 đến 200 ký tự.'
    })
    specificAddress?: string;

    @IsOptional()
    @IsPhoneNumber('VN', { message: 'Số điện thoại phải đúng định dạng số Việt Nam.' })
    phoneNumber?: string;

    @IsOptional()
    @IsEmail({}, { message: 'Email phải đúng định dạng' })
    email?: string;

    @IsOptional()
    @IsString()
    @Length(10, 13, {
        message: 'Mã số thuế phải trong khoảng từ 10 đến 13 ký tự.'
    })
    @Matches(/^[A-Za-z0-9\-]+$/, { message: 'Mã số thuế phải đúng định dạng.' })
    taxCode?: string;
}
