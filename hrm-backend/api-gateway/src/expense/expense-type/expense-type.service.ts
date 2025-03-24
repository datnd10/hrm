import {
  Body,
  HttpStatus,
  Inject,
  Injectable,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { ExpenseTypeCategory } from '@shared/constants/enum';
import { CreateExpenseTypeDto } from '@shared/dto/expense-type/create-expense-type.dto';
import { UpdateExpenseTypeDto } from '@shared/dto/expense-type/update-expense-type.dto';
import { ExpenseType } from '@shared/entities/expense-type.entity';
import { User } from '@shared/entities/user.entity';
import { sendMessageKafka } from 'src/common/kafka.helper';

@Injectable()
export class ExpenseTypeService {
  constructor(
    @Inject('EXPENSE_SERVICE')
    private readonly expenseTypeClient: ClientKafka,
  ) { }

  async create(
    createExpenseTypeDto: CreateExpenseTypeDto,
    user: User,
  ): Promise<any> {
    const payload = {
      createExpenseTypeDto,
      user,
    };
    return sendMessageKafka<ExpenseType>(
      this.expenseTypeClient,
      'add-expense-type',
      JSON.stringify(payload),
    );
  }

  async findAll(user: User): Promise<ExpenseType[]> {
    return sendMessageKafka<ExpenseType[]>(
      this.expenseTypeClient,
      'find-all',
      JSON.stringify(user),
    );
  }

  async filterExpense(
    user: User,
    options: { page: number; limit: number },
    filters: {
      search?: string;
      type?: ExpenseTypeCategory;
      sortBy?: string;
      sortDirection?: 'ASC' | 'DESC';
    })
    : Promise<ExpenseType[]> {
    return sendMessageKafka<ExpenseType[]>(
      this.expenseTypeClient,
      'filter-expense-type',
      JSON.stringify({ user, options, filters }),
    );
  }

  async findOne(id: number, user: User): Promise<ExpenseType> {
    return sendMessageKafka<ExpenseType>(
      this.expenseTypeClient,
      'find-one-expense-type',
      JSON.stringify({ id, user }),
    );
  }

  async update(
    id: number,
    updateExpenseTypeDto: UpdateExpenseTypeDto,
    user: User,
  ): Promise<ExpenseType> {
    return sendMessageKafka<ExpenseType>(
      this.expenseTypeClient,
      'update-expense-type',
      JSON.stringify({
        id,
        updateExpenseTypeDto,
        user,
      }),
    );
  }

  async remove(ids: number[], user: User): Promise<void> {
    return sendMessageKafka<void>(
      this.expenseTypeClient,
      'remove-expense-type',
      {
        ids,
        user,
      },
    );
  }
}
