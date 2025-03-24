import { PartialType } from '@nestjs/mapped-types';
import { IsNumber, IsOptional } from 'class-validator';
import { CreateExpenseDto } from './create-expense.dto';

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {
}
