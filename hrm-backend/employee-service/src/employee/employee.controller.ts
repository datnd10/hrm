import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from '@shared/dto/employee/create-employee.dto';
import { UpdateEmployeeDto } from '@shared/dto/employee/update-employee.dto';
import { plainToInstance } from 'class-transformer';
import { handleError } from '@shared/util/error-handler';
@Controller()
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) { }

  @MessagePattern('add-employee')
  async create(@Payload() data: any) {
    try {
      const { createEmployeeDto, user } = data;
      const payload = plainToInstance(CreateEmployeeDto, createEmployeeDto);
      const result = await this.employeeService.create(payload, user);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('find-all-employee')
  async findAll(@Payload() data: any) {
    try {
      const { user } = data;
      return await this.employeeService.findAll(user);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('filter-employee')
  async filterEmployee(@Payload() data: any) {
    try {

      const { user, options, filters } = data;
      const result = await this.employeeService.filterEmployee(user, options, filters);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('find-one-employee')
  async findOne(@Payload() data: any) {
    try {
      const { id, user } = data;
      const result = await this.employeeService.getOneEmployee(id, user);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('update-employee')
  async update(@Payload() data: any) {
    try {
      const { id, updateEmployeeDto, user } = data;
      const updateEmployee = plainToInstance(
        UpdateEmployeeDto,
        updateEmployeeDto,
      );
      const result = await this.employeeService.update(
        id,
        updateEmployeeDto,
        user,
      );
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('remove-employee')
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
      const result = await this.employeeService.remove(id, user);

      // Trả về kết quả dưới dạng JSON
      return { status: 'success', data: result };
    } catch (error) {
      // Xử lý lỗi và trả về phản hồi lỗi
      console.error('Error in remove:', error.message);
      return { status: 'error', message: error.message };
    }
  }

  @MessagePattern('get-employee-by-department')
  async findEmployeeByDepartment(@Payload() data: any) {
    try {
      const { departmentId, user } = data;
      const result = await this.employeeService.findEmployeeByDepartment(
        departmentId,
        user,
      );
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('get-employee-by-branch')
  async findEmployeeByBranch(@Payload() data: any) {
    try {
      const { branchId, user } = data;
      const result = await this.employeeService.findEmployeeByBranch(
        branchId,
        user,
      );
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }
}
