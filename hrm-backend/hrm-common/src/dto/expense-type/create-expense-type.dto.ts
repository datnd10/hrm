import { IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Length, Min, ValidateNested } from "class-validator";
import { ExpenseTypeCategory, FormulaType } from "../../constants/enum";
import { Type } from "class-transformer";
import { CreateExpenseRangeDto } from "../expense-range/create-expense-range";

export class CreateExpenseTypeDto {
  @IsString({ message: 'Tên phải là một chuỗi ký tự.' })
  @IsNotEmpty({ message: 'Tên không được để trống.' })
  @Length(2, 50, { message: 'Tên phải có độ dài từ 3 đến 50 ký tự.' })
  name: string;

  @IsString({ message: 'Mô tả phải là một chuỗi ký tự.' })
  @IsOptional()
  @Length(0, 200, { message: 'Mô tả không được vượt quá 200 ký tự.' })
  description?: string;

  @IsPositive({ message: 'Tiền phải là số dương và lớn hơn 0.' })
  @IsOptional()
  basePrice?: number;

  @IsEnum(ExpenseTypeCategory, { message: 'Loại phải là một trong các giá trị: SALARY,OTHER, DEDUCTION' })
  @IsNotEmpty({ message: 'Loại là bắt buộc.' })
  type: ExpenseTypeCategory;

  @IsEnum(FormulaType, { message: 'Công thức tính lương phải là một trong các giá trị: BASE_SALARY, FIXED_COST, VARIABLE_COST, TIERED_COST' })
  @IsNotEmpty({ message: 'Công thức tính lương là bắt buộc.' })
  formulaType: FormulaType;

  @IsArray({ message: 'expenseItems phải là một mảng.' })
  @ValidateNested({ each: true, message: 'Mỗi phần tử trong expenseItems phải là đối tượng hợp lệ.' })
  @Type(() => CreateExpenseRangeDto)
  @IsOptional()
  expenseRanges?: CreateExpenseRangeDto[];
}
