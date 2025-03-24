import { PartialType } from '@nestjs/mapped-types';
import { CreateExpenseItemDto } from './create-expense-item';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateExpenseItemDto extends PartialType(CreateExpenseItemDto) {

}
