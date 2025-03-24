import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ExpenseTypeService } from './expense-type.service';
import { CreateExpenseTypeDto } from '@shared/dto/expense-type/create-expense-type.dto';
import { UpdateExpenseTypeDto } from '@shared/dto/expense-type/update-expense-type.dto';
import { plainToInstance } from 'class-transformer';
import { handleError } from '@shared/util/error-handler';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('expense-type')
export class ExpenseTypeController {
  constructor(private readonly expenseTypeService: ExpenseTypeService) { }

  @MessagePattern('initialize-expense-type')
  async initializeExpenseTypes(@Payload() data: any) {
    try {
      const { user } = data;
      const result = await this.expenseTypeService.initializeExpenseTypes(user);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('find-all')
  async findAllExpenseType() {
    try {
      const result = await this.expenseTypeService.findAll();
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('filter-expense-type')
  async filterExpenseType(@Payload() data: any) {
    try {
      const { user, options, filters } = data;
      const result = await this.expenseTypeService.filterExpenseType(
        user,
        options,
        filters,
      );
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('add-expense-type')
  async create(@Body() data: any) {
    try {
      console.log(data);
      const { createExpenseTypeDto, user } = data;
      const payload = plainToInstance(CreateExpenseTypeDto, createExpenseTypeDto);
      const result = await this.expenseTypeService.create(payload, user);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('find-one-expense-type')
  async findOne(@Body() data: any) {
    const { id } = data;
    try {
      const result = await this.expenseTypeService.findOne(id);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('update-expense-type')
  async update(@Body() data: any) {
    const { id, updateExpenseTypeDto, user } = data;
    try {
      const ccc = plainToInstance(UpdateExpenseTypeDto, updateExpenseTypeDto);
      const result = await this.expenseTypeService.update(id, ccc);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('remove-expense-type')
  async remove(@Body() data: any) {
    const { ids } = data;
    try {
      const result = await this.expenseTypeService.remove([ids]);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }
}
