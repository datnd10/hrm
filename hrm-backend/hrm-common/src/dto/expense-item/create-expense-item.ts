import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, Max, Min } from 'class-validator';

export class CreateExpenseItemDto {
    @IsNotEmpty({ message: 'Loại chi phí là bắt buộc.' })
    @IsInt({ message: 'Loại chi phí phải là số nguyên.' })
    expenseTypeId: number;

    @IsOptional()
    expenseItemName?: string;

    @IsNotEmpty({ message: 'Số lượng phải là bắt buộc.' })
    @IsPositive({ message: 'Số lần phải là số dương.' })  // Đảm bảo quantity là số dương
    quantity: number;

    @IsOptional()
    @Min(0, { message: 'Giá phải lớn hơn hoặc bằng 0.' })
    price?: number = 0;

    @IsOptional()
    @Min(0, { message: 'Số lần phải lớn hơn hoặc bằng 0.' })
    baseQuantity?: number = 0;

    @IsOptional()
    @Min(0, { message: 'Thuế phải lớn hơn hoặc bằng 0.' })
    @Max(100, { message: 'Thuế sẽ phải trong khoảng 0-100.' })
    taxRate?: number = 0;

    @IsOptional()
    @Min(0, { message: 'Giảm giá phải lớn hơn hoặc bằng 0.' })
    @Max(100, { message: 'Giảm giá sẽ phải trong khoảng 0-100.' })
    discount?: number = 0;
}
