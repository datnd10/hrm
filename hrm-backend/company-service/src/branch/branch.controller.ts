import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BranchService } from './branch.service';
import { plainToInstance } from 'class-transformer';
import { CreateBranchDto } from '@shared/dto/branch/create-branch.dto';
import { UpdateBranchDto } from '@shared/dto/branch/update-branch.dto';
import { handleError } from '@shared/util/error-handler'
import { da } from '@faker-js/faker';

@Controller()
export class BranchController {
  constructor(private readonly branchService: BranchService) { }

  @MessagePattern('initialize-branch')
  async initBranch(@Payload() data: any) {
    try {
      const result = await this.branchService.initBranch(data.data);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('add-branch')
  async create(@Payload() payload: any) {
    try {
      const { branchData, user } = payload;
      const data = plainToInstance(CreateBranchDto, branchData);
      const result = await this.branchService.create(data, user);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('filter-branch')
  async filterBranch(@Payload() data: any) {
    const { user, filters, paginationOptions } = data;
    try {
      const result = await this.branchService.filterBranch(user, paginationOptions, filters);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('find-all-branch')
  async findAll(@Payload() data: any) {
    try {
      const result = await this.branchService.findAll(data);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }


  @MessagePattern('find-one-branch')
  async findOne(@Payload() data: any) {
    try {
      const { id, user } = data;
      const result = await this.branchService.findOne(id, user);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('update-branch')
  async update(@Payload() data: any) {
    try {
      const { id, updateBranchDto, user } = data;
      const updateBranch = plainToInstance(UpdateBranchDto, updateBranchDto);
      const result = await this.branchService.update(id, updateBranch, user);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('delete-branch')
  async remove(@Payload() data: any) {
    try {
      const { ids, user } = data;
      const result = await this.branchService.remove(ids, user);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }
}
