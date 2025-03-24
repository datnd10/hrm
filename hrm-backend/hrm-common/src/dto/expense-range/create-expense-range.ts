import { Type } from 'class-transformer';
import { IsNumber, IsNotEmpty, IsPositive, IsArray, ArrayNotEmpty, ValidateNested, Min, } from 'class-validator';
import { IsMinRangeLessThanMaxRange } from '../../validators/validation.pipe';

export class CreateExpenseRangeDto {

    @IsNotEmpty({ message: 'Giá trị đầu là bắt buộc.' })
    @IsNumber({}, { message: 'Giá trị đầu phải là một số.' })
    @Min(0, { message: 'Giá trị đầu phải là số không âm.' }) // Cho phép minRange bằng 0
    minRange: number;

    @IsNotEmpty({ message: 'Giá trị cuối là bắt buộc.' })
    @IsNumber({}, { message: 'Giá trị cuối phải là một số.' })
    @IsPositive({ message: 'Giá trị cuối phải là số dương.' })
    @IsMinRangeLessThanMaxRange({ message: 'Giá trị đầu (minRange) phải nhỏ hơn giá trị cuối (maxRange).' })
    maxRange: number;

    @IsNotEmpty({ message: 'Giá tiền là bắt buộc.' })
    @IsNumber({}, { message: 'Giá tiền phải là một số.' })
    @IsPositive({ message: 'Giá tiền phải là số dương.' })
    price: number;
}
