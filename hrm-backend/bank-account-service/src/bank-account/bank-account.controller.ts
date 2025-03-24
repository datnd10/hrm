import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BankAccountService } from './bank-account.service';
import { CreateBankAccountDto } from '@shared/dto/bank-account/create-bank-account.dto';
import { UpdateBankAccountDto } from '@shared/dto/bank-account/update-bank-account.dto';
import { plainToInstance } from 'class-transformer';
import { handleError } from '@shared/util/error-handler';
import { validate } from 'class-validator';

@Controller()
export class BankAccountController {
  constructor(private readonly bankAccountService: BankAccountService) { }

  @MessagePattern('filter-bank-account')
  async filterBank(@Payload() data: any) {
    const { user, filters, paginationOptions } = data;
    try {
      const result = await this.bankAccountService.filterBank(user, paginationOptions, filters);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('add-bank-account')
  async create(@Payload() data: any) {
    try {
      const { createBankAccountDto, user } = data; // Không cần user ở đây
      const payload = plainToInstance(
        CreateBankAccountDto,
        createBankAccountDto,
      );
      const result = await this.bankAccountService.create(payload, user); // Chỉ truyền payload
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('find-all-bank-account')
  async findAll(@Payload() data: any) {
    try {
      const { user } = data;
      return await this.bankAccountService.findAll(user); // Không cần user
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('find-one-bank-account')
  async findOne(@Payload() data: any) {
    try {
      const { id, user } = data; // Extract the `id` from the request payload
      const result = await this.bankAccountService.findOne(id, user); // Call service method to get the bank account by id
      return JSON.stringify(result); // Return the result as JSON string
    } catch (error) {
      handleError(error); // Handle any error that might occur
    }
  }

  @MessagePattern('update-bank-account')
  async update(@Payload() data: any) {
    try {
      let { id, updateBankAccountDto, user } = data;

      // Kiểm tra nếu id là chuỗi, chuyển thành số
      id = parseInt(id, 10);

      if (isNaN(id)) {
        throw new Error('ID must be a valid number.');
      }

      // Chuyển đổi plain object thành DTO instance và xác thực nó
      const updateBankAccount = plainToInstance(
        UpdateBankAccountDto,
        updateBankAccountDto,
      );

      // Xác thực DTO để đảm bảo dữ liệu hợp lệ
      const errors = await validate(updateBankAccount);
      if (errors.length > 0) {
        throw new Error('Validation failed: ' + JSON.stringify(errors));
      }

      // Gọi service update với id và DTO đã được xác thực
      const result = await this.bankAccountService.update(
        id,
        updateBankAccount,
        user
      );

      return JSON.stringify(result);
    } catch (error) {
      // Xử lý lỗi
      handleError(error);
    }
  }

  @MessagePattern('remove-bank-account')
  async remove(@Payload() data: any) {
    try {
      // Log payload to check data
      console.log('Received payload:', data);

      // Check if ids exist
      if (!data.ids) {
        return {
          status: 'error',
          message: '`ids` is required.',
        };
      }

      let ids = data.ids;

      // Nếu ids không phải là mảng, chuyển thành mảng
      if (!Array.isArray(ids)) {
        ids = [ids];
      }

      // Call the service to remove the bank accounts
      const result = await this.bankAccountService.remove(ids); // Không cần user

      // Return the result as JSON
      return { status: 'success', data: result };
    } catch (error) {
      console.error('Error in remove:', error.message);
      return { status: 'error', message: error.message };
    }
  }
}
