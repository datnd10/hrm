import { Body, Controller } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { plainToInstance } from 'class-transformer';
import { CreateExpenseDto } from '@shared/dto/expense/create-expense.dto';
import { handleError } from '@shared/util/error-handler';
import { UpdateExpenseDto } from '@shared/dto/expense/update-expense.dto';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { ExpenseCategory } from '@shared/constants/enum';

@Controller('expense')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService, @InjectQueue('expense-queue') private readonly expenseQueue: Queue) { }

  @MessagePattern('import-salary')
  async import(@Payload() data: any) {
    try {
      const { file, type, user } = data;
      const jobId = await this.expenseService.processImportJob(file, type, user);
      // Trả về thông tin job
      return { message: 'Công việc đang được sử lý', jobId };
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('get-template-expense')
  async getTemplate(@Payload() data: any) {
    try {
      const { user, branch, type, billingCycle } = data;
      let result: any;
      if (type === ExpenseCategory.SALARY) {
        result = await this.expenseService.getSalaryTemplate(user, branch, type, billingCycle);
      }
      else if (type === ExpenseCategory.OTHER) {
        result = await this.expenseService.getExpenseTemplate(user, branch, type, billingCycle);
      }
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('export-salary')
  async exportSalary(@Payload() data: any) {
    try {
      const { user } = data;
      const result = await this.expenseService.exportSalary(user);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('export-expense')
  async exportExpense(@Payload() data: any) {
    try {
      const { user } = data;
      const result = await this.expenseService.exportExpense(user);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('add-expense')
  async create(@Payload() data: any) {
    try {
      const { createExpenseDto, user } = data;
      const payload = plainToInstance(CreateExpenseDto, createExpenseDto);
      const result = await this.expenseService.create(payload);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('find-all-expense')
  async findAll() {
    try {
      const result = await this.expenseService.findAll();
      console.log(result);

      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('find-one-expense')
  async findOne(@Payload() data: any) {
    const { id, user } = data;
    try {
      const result = await this.expenseService.findOne(id, user);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('filter-expense')
  async filterExpense(@Payload() data: any) {
    try {
      const { user, options, filters } = data;
      const result = await this.expenseService.filterExpense(
        user,
        options,
        filters,
      );
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('update-expense')
  async update(@Payload() data: any) {
    try {
      const { id, updateExpenseDto, user } = data;
      const updateExpense = plainToInstance(UpdateExpenseDto, updateExpenseDto);
      const result = await this.expenseService.update(id, updateExpense, user);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('update-status-expense')
  async updateStatus(@Payload() data: any) {
    try {
      const { updateStatusDto, user } = data;
      const { ids, status, expenseDate, bankAccountId } = updateStatusDto;

      // Pass all necessary fields to the service layer
      const result = await this.expenseService.updateStatus(ids, status, expenseDate, bankAccountId);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }


  @MessagePattern('remove-expense')
  async remove(@Body() data: any) {
    const { ids } = data;
    try {
      const result = await this.expenseService.remove([ids]);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }
}
