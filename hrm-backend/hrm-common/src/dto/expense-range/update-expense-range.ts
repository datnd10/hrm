import { PartialType } from '@nestjs/mapped-types';
import { CreateExpenseRangeDto } from './create-expense-range';

export class UpdateExpenseRageDto extends PartialType(CreateExpenseRangeDto) {

}
