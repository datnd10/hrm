import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Expense } from '@shared/entities/expense.entity';
import { User } from '@shared/entities/user.entity';
import { sendMessageKafka } from 'src/common/kafka.helper';
import { CreateExpenseDto } from '@shared/dto/expense/create-expense.dto';
import { UpdateExpenseDto } from '@shared/dto/expense/update-expense.dto';
import { UpdateStatusDto } from '@shared/dto/expense/update-status.dto';
import { ExpenseCategory } from '@shared/constants/enum';
@Injectable()
export class ExpenseService {
  constructor(
    @Inject('EXPENSE_SERVICE')
    private readonly expenseClient: ClientKafka,
  ) { }

  async importData(file: Express.Multer.File, type: ExpenseCategory, user: User): Promise<any> {
    return sendMessageKafka<any>(
      this.expenseClient,
      'import-salary',
      JSON.stringify({ file, type, user }),
    );
  }
  async getTemplate(user: User, branch: string | number, type: ExpenseCategory, billingCycle: string): Promise<any> {
    return sendMessageKafka<any>(
      this.expenseClient,
      'get-template-expense',
      JSON.stringify({ user, branch, type, billingCycle }),
    );
  }

  async exportSalary(user: User): Promise<any> {
    return sendMessageKafka<any>(
      this.expenseClient,
      'export-salary',
      JSON.stringify({ user }),
    );
  }

  async exportExpense(user: User): Promise<any> {
    return sendMessageKafka<any>(
      this.expenseClient,
      'export-expense',
      JSON.stringify({ user }),
    );
  }

  async create(createExpenseDto: CreateExpenseDto, user: User): Promise<any> {
    const payload = {
      createExpenseDto,
      user,
    };
    return sendMessageKafka<Expense>(
      this.expenseClient,
      'add-expense',
      JSON.stringify(payload),
    );
  }
  async findAll(user: User): Promise<Expense[]> {
    return sendMessageKafka<Expense[]>(
      this.expenseClient,
      'find-all-expense',
      JSON.stringify(user),
    );
  }
  // filterExpenseType
  async filterExpense(
    user: User,
    options: { page: number; limit: number },
    filters: { type: string; search: string; sortBy: string; branchId: number, status: string, sortDirection: 'ASC' | 'DESC', employeeId: number, billingCycle: string },
  ): Promise<Expense[]> {
    const message = { user, filters, options };
    return sendMessageKafka<Expense[]>(
      this.expenseClient,
      'filter-expense',
      JSON.stringify(message),
    );
  }

  async findOne(id: number, user: User): Promise<Expense> {
    return sendMessageKafka<Expense>(
      this.expenseClient,
      'find-one-expense',
      JSON.stringify({ id, user }),
    );
  }

  async update(
    id: number,
    updateExpenseDto: UpdateExpenseDto,
    user: User,
  ): Promise<Expense> {
    return sendMessageKafka<Expense>(
      this.expenseClient,
      'update-expense',
      JSON.stringify({
        id,
        updateExpenseDto,
        user,
      }),
    );
  }

  async updateStatus(updateStatusDto: UpdateStatusDto, user: User): Promise<Expense> {
    return sendMessageKafka<Expense>(
      this.expenseClient,
      'update-status-expense',
      JSON.stringify({ updateStatusDto, user }),
    );
  }


  async remove(ids: number[], user: User): Promise<void> {
    return sendMessageKafka<void>(this.expenseClient, 'remove-expense', {
      ids,
      user,
    });
  }
}
