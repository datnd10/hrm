import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { ExpenseCategory } from "../../constants/enum";

export class GetTemplateDto {
    @IsNotEmpty({ message: 'Chi nhanh phải là bắt buộc.' })
    branch: string;

    @IsEnum(ExpenseCategory, { message: 'Loại hóa đơn phải là lương hoặc chi phí khác' })
    @IsNotEmpty({ message: 'Loại hóa đơn phải là bắt buộc.' })
    type: ExpenseCategory; // Loại hóa đơn

    @IsNotEmpty({ message: 'Kỳ thanh toán phải là bắt buộc.' })
    billingCycle: string;
}
