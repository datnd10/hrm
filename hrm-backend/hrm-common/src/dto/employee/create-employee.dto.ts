import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsBoolean,
  Length,
  Matches,
  IsInt,
  Min,
  IsEnum,
  IsPhoneNumber,
  IsNumber,
} from "class-validator";
import { Type } from "class-transformer";
import { Gender } from "../../constants/enum";

export class CreateEmployeeDto {
  @IsNotEmpty({ message: "Tên đầy đủ là bắt buộc." })
  @IsString({ message: "Tên đầy đủ phải là chuỗi." })
  @Length(3, 100, { message: "Tên đầy đủ phải từ 3 đến 100 ký tự." })
  fullName: string;

  @IsEnum(Gender, { message: "Giới tính không hợp lệ." })
  gender: Gender;

  @IsNotEmpty({ message: "Ngày sinh là bắt buộc." })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Ngày sinh phải theo định dạng yyyy-mm-dd.",
  })
  dateOfBirth: string;

  @IsEmail({}, { message: "Email không đúng định dạng." })
  @IsNotEmpty({ message: "Email là bắt buộc." })
  email?: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 255, {
    message: "Password name should be between 8 and 255 characters",
  })
  @Matches(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)/, {
    message:
      "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character",
  })
  password: string;

  @IsNotEmpty({ message: "Quyền là bắt buộc." })
  @Type(() => Number)
  @IsInt({ message: "Quyền phải là số nguyên." })
  @Min(1, { message: "Quyền phải lớn hơn hoặc bằng 1." })
  roleId: number;

  @IsOptional()
  @IsString({ message: "Số CMND/CCCD phải là chuỗi." })
  @Matches(/^\d{9,12}$/, {
    message: "Số CMND/CCCD phải chứa từ 9 đến 12 chữ số.",
  })
  idCard?: string;

  @IsOptional()
  @Matches(/^\d{10,13}$/, {
    message: "Mã số thuế phải chứa từ 10 đến 13 chữ số.",
  })
  taxCode?: string;

  @IsPhoneNumber("VN", { message: "Số điện thoại phải là số Việt Nam hợp lệ." })
  @IsNotEmpty({ message: "Số điện thoại là bắt buộc." })
  phoneNumber: string;

  @IsOptional()
  @Length(3, 100, { message: "Tỉnh/Thành Phố phải từ 3 đến 100 ký tự." })
  @IsOptional()
  province?: string;

  @IsString({ message: "Quận/Huyện phải là chuỗi." })
  @Length(2, 100, { message: "Quận/Huyện phải từ 2 đến 100 ký tự." })
  @IsOptional()
  district?: string;

  @IsString({ message: "Phường/Xã phải là chuỗi." })
  @Length(2, 100, { message: "Phường/Xã phải từ 2 đến 100 ký tự." })
  @IsOptional()
  ward?: string;

  @IsString({ message: "Địa chỉ phải là chuỗi." })
  @Length(2, 200, { message: "Địa chỉ chi tiết phải từ 2 đến 200 ký tự." })
  @IsOptional()
  specificAddress?: string;

  @IsOptional()
  @IsString({ message: "Ảnh đại diện phải là chuỗi." })
  avatar?: string;

  @IsNotEmpty({ message: "Phòng ban là bắt buộc." })
  @Type(() => Number)
  @IsInt({ message: "Phòng ban phải là số nguyên." })
  @Min(1, { message: "Phòng ban phải lớn hơn hoặc bằng 1." })
  departmentId: number;

  @IsNotEmpty({ message: "Chức vụ là bắt buộc." })
  @Type(() => Number)
  @IsInt({ message: "Chức vụ phải là số nguyên." })
  @Min(1, { message: "Chức vụ phải lớn hơn hoặc bằng 1." })
  positionId: number;

  // Thông tin tài khoản ngân hàng
  @IsNotEmpty({ message: "Số tài khoản là bắt buộc." })
  @IsString({ message: "Số tài khoản phải là chuỗi." })
  accountNumber: string;

  @IsNotEmpty({ message: "Tên tài khoản là bắt buộc." })
  @IsString({ message: "Tên tài khoản phải là chuỗi." })
  accountName: string;

  @IsNotEmpty({ message: "Tên ngân hàng là bắt buộc." })
  @IsString({ message: "Tên ngân hàng phải là chuỗi." })
  bankName: string;

  @IsOptional()
  @IsNumber({}, { message: "Id phải là một số." })
  accountId?: number;
}
