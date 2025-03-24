import { Transform } from 'class-transformer';
import { IsEnum, IsArray, ArrayNotEmpty, IsOptional, IsInt, IsPositive, IsNotEmpty, IsDateString } from 'class-validator';

export class UpdateStatusDto {
    @IsArray()
    @ArrayNotEmpty()
    ids: number[];


    @IsNotEmpty({ message: 'Ngày chi là bắt buộc.' })
    @IsDateString({ strict: true }, { message: 'Ngày chi phải là một ngày hợp lệ (định dạng YYYY-MM-DDTHH:mm:ss).' })
    @Transform(({ value }) => value || new Date().toISOString()) // Default to current date and time if not provided
    @IsOptional()
    expenseDate?: string; // Ngày chi including time


    @IsInt({ message: 'Tài khoản phải là số nguyên.' })
    @IsPositive({ message: 'Tài khoản phải là số dương.' })
    @IsOptional()
    bankAccountId?: number;


    @IsEnum(['APPROVED', 'REJECTED'], {
        message: 'Trạng thái phải là duyệt hay từ chối',
    })
    status: 'APPROVED' | 'REJECTED';
}
