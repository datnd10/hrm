import { IsNotEmpty, IsNumber, IsEnum, IsOptional, IsDate, IsString, IsPositive } from 'class-validator';
import { ContractStatus } from "../../constants/enum";
import { Type } from 'class-transformer';

export class CreateContractDto {
    @IsString({ message: 'Tên hợp đồng phải là chuỗi ký tự.' })
    @IsNotEmpty({ message: 'Tên hợp đồng không được để trống.' })
    contractName: string;

    @IsDate({ message: 'Ngày bắt đầu phải là ngày hợp lệ.' })
    @Type(() => Date)
    @IsNotEmpty({ message: 'Ngày bắt đầu là bắt buộc.' })
    startDate: Date;

    @IsDate({ message: 'Ngày kết thúc phải là ngày hợp lệ.' })
    @Type(() => Date)
    @IsOptional()
    endDate?: Date;

    @IsString({ message: 'Mô tả phải là chuỗi ký tự.' })
    @IsOptional()
    description?: string;

    @IsPositive({ message: 'Tiền phải là số dương và lớn hơn 0.' })
    @IsNotEmpty({ message: 'Lương là bắt buộc.' })
    salary: number;

    @IsEnum(ContractStatus, { message: 'Trạng thái hợp đồng phải là ACTIVE hoặc INACTIVE.' })
    @IsOptional()
    status?: ContractStatus;

    @IsNumber({}, { message: 'Employee ID phải là một số.' })
    @IsNotEmpty({ message: 'Employee ID là bắt buộc.' })
    employeeId: number;
}
