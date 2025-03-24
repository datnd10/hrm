import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ContractService } from './contract.service';
import { CreateContractDto } from '@shared/dto/contract/create-contract.dto';
import { UpdateContractDto } from '@shared/dto/contract/update-contract.dto';
import { plainToInstance } from 'class-transformer';
import { handleError } from '@shared/util/error-handler';

@Controller()
export class ContractController {
  constructor(private readonly contractService: ContractService) { }

  @MessagePattern('add-contract')
  async create(@Payload() data: any) {
    try {
      const { createContractDto, user } = data;
      const payload = plainToInstance(CreateContractDto, createContractDto);
      const result = await this.contractService.create(payload, user);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('find-all-contract')
  async findAll(@Payload() data: any) {
    try {
      const { user } = data;
      return await this.contractService.findAll(user);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('filter-contract')
  async filterContract(@Payload() data: any) {
    try {
      const { user, options, filters } = data;
      const result = await this.contractService.filterContract(user, options, filters);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('find-one-contract')
  async findOne(@Payload() data: any) {
    try {
      const { id, user } = data;
      const result = await this.contractService.findOne(id, user);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }


  @MessagePattern('find-by-employee-contract')
  async findOneByEmployee(@Payload() data: any) {
    try {
      const { id, user } = data;
      const result = await this.contractService.findOneByEmployee(id, user);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('update-contract')
  async update(@Payload() data: any) {
    try {
      const { id, updateContractDto, user } = data;
      const updateContract = plainToInstance(
        UpdateContractDto,
        updateContractDto,
      );
      const result = await this.contractService.update(
        id,
        updateContract,
        user,
      );
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('remove-contract')
  async remove(@Payload() data: any) {
    try {
      console.log('Received payload:', data); // Để log giá trị của `data`

      // Kiểm tra xem `id` và `user` có tồn tại và `id` là một mảng
      if (!data.id || !Array.isArray(data.id) || !data.user) {
        return {
          status: 'error',
          message:
            'Dữ liệu không hợp lệ. `id` phải là một mảng và phải có `user`.',
        };
      }

      const { id, user } = data;

      // Gọi tới service để xóa các nhân viên
      const result = await this.contractService.remove(id, user);

      return JSON.stringify(result);
    } catch (error) {
      // Xử lý lỗi và trả về phản hồi lỗi
      console.error('Error in remove:', error.message);
      return { status: 'error', message: error.message };
    }
  }
}
