import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from '@shared/dto/department/create-department.dto'
import { UpdateDepartmentDto } from '@shared/dto/department/update-department.dto'
import { plainToInstance } from 'class-transformer';
import { handleError } from '@shared/util/error-handler';
import { da } from '@faker-js/faker';

@Controller()
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) { }

  @MessagePattern('add-department')
  async create(@Payload() data: any) {
    try {
      const { createDepartmentDto, user } = data;
      const payload = plainToInstance(CreateDepartmentDto, createDepartmentDto);
      const result = await this.departmentService.create(payload, user);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('find-all-department')
  async findAll(@Payload() data: any) {
    try {
      const { user } = data;
      return await this.departmentService.findAll(user);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('find-one-department')
  async findOne(@Payload() data: any,) {
    try {
      const { id, user } = data;
      const result = await this.departmentService.findOne(id, user);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('find-department-by-branch')
  async findByName(@Payload() data: any) {
    try {
      const { id } = data;
      const result = await this.departmentService.findDepartmentByBranch(id);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('update-department')
  async update(@Payload() data: any) {
    try {
      const { id, updateDepartmentDto, user } = data;
      const updateDepartment = plainToInstance(UpdateDepartmentDto, updateDepartmentDto);
      const result = await this.departmentService.update(id, updateDepartment, user);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('remove-department')
  async remove(@Payload() data: any) {
    try {
      const { ids, user } = data;
      const result = await this.departmentService.remove(ids, user);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }
}
