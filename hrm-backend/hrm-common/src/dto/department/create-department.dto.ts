import { IsInt, IsOptional, IsString, IsPositive, IsNotEmpty } from 'class-validator';
// Đảm bảo rằng bạn import đúng entity

export class CreateDepartmentDto {

    @IsString()
    @IsNotEmpty({ message: 'Tên phòng ban là bắt buộc.' })
    departmentName: string;

    @IsInt()
    @IsPositive({ message: 'Chi nhánh phải là số dương.' })  // Thêm ràng buộc IsPositive để đảm bảo số dương
    branchId: number;  // Đối tượng Branch

    @IsInt()
    @IsOptional()
    @IsPositive({ message: 'Phòng ban phải là số dương.' })
    parentDepartmentId?: number;
}
