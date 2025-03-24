import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsPositive, ValidateNested, IsString, ArrayNotEmpty, IsNotEmpty, Min, Max, IsEnum, IsDate, IsDateString } from 'class-validator';
import { CreateExpenseItemDto } from '../expense-item/create-expense-item';
import { ExpenseStatus, ExpenseCategory } from '../../constants/enum';

export class CreateExpenseDto {
    @IsInt({ message: 'Mã người dùng phải là số nguyên.' })
    @IsPositive({ message: 'Mã người dùng phải là số dương.' })
    @IsOptional()
    employeeId?: number; // Mã người dùng

    @IsString({ message: 'Tên hóa đơn phải là chuỗi.' })
    @IsNotEmpty({ message: 'Tên hóa đơn phải là bắt buộc.' })
    expenseName: string; // Mô tả hóa đơn, có thể không bắt buộc

    @IsString({ message: 'Kì thanh toán phải là chuỗi.' })
    @IsNotEmpty({ message: 'Kì thanh toán phải là bắt buộc.' })
    billingCycle: string;

    @IsEnum(ExpenseCategory, { message: 'Loại hóa đơn phải là lương hoặc chi phí khác' })
    @IsNotEmpty({ message: 'Loại hóa đơn phải là bắt buộc.' })
    type: ExpenseCategory; // Loại hóa đơn

    @IsInt({ message: 'Tài khoản phải là số nguyên.' })
    @IsPositive({ message: 'Tài khoản phải là số dương.' })
    @IsOptional()
    bankAccountId?: number;

    @IsOptional()
    @IsEnum(ExpenseStatus, { message: 'Trạng thái hóa đơn phải là PENDING, APPROVED, hoặc REJECTED' })
    status?: ExpenseStatus; // Trạng thái hóa đơn với 3 giá trị enum

    @Min(0, { message: 'Thuế phải từ 0.' })
    @Max(100, { message: 'Thuế không thể lớn hơn 100%.' })
    @IsOptional()
    taxRate?: number; // Thuế suất

    @IsInt({ message: 'Mã chi nhánh phải là số nguyên.' })
    @IsPositive({ message: 'Mã chi nhánh phải là số dương.' })
    @IsNotEmpty({ message: 'Mã chi nhánh phải là bắt buộc.' })
    branchId: number; // Mã chi nhánh

    @IsArray({ message: 'expenseItems phải là một mảng.' })
    @ArrayNotEmpty({ message: 'expenseItems không được là mảng rỗng.' })
    @ValidateNested({ each: true, message: 'Mỗi phần tử trong expenseItems phải là đối tượng hợp lệ.' })
    @Type(() => CreateExpenseItemDto)
    expenseItems: CreateExpenseItemDto[];

    @IsNotEmpty({ message: 'Ngày chi là bắt buộc.' })
    @IsDateString({ strict: true }, { message: 'Ngày chi phải là một ngày hợp lệ (định dạng YYYY-MM-DDTHH:mm:ss).' })
    @Transform(({ value }) => value || new Date().toISOString()) // Default to current date and time if not provided
    @IsOptional()
    expenseDate?: string; // Ngày chi including time
}
