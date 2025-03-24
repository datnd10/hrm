import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PositionService } from './position.service';
import { CreatePositionDto } from '@shared/dto/position/create-position.dto';
import { UpdatePositionDto } from '@shared/dto/position/update-position.dto';
import { plainToInstance } from 'class-transformer';
import { handleError } from '@shared/util/error-handler';

@Controller()
export class PositionController {
  constructor(private readonly positionService: PositionService) { }

  @MessagePattern('add-position')
  async create(@Payload() payload: any) {
    try {
      const { createPositionDto, user } = payload;
      const data = plainToInstance(CreatePositionDto, createPositionDto);
      const result = await this.positionService.create(data, user);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('filter-position')
  async filterPosition(@Payload() data: any) {
    try {
      const { user, filters, paginationOptions } = data;
      const result = await this.positionService.filterPosition(user, paginationOptions, filters);
      return JSON.stringify(result);
    }
    catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('find-all-position')
  async findAll(@Payload() data: any) {
    try {
      const { user } = data;
      return await this.positionService.findAll(user);
    }
    catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('find-one-position')
  async findOne(@Payload() data: any) {
    try {
      const { id, user } = data;
      const result = await this.positionService.findOne(id, user);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('find-by-department-id')
  async findByDepartmentId(@Payload() data: any) {
    try {
      const { id, user } = data;
      const result = await this.positionService.findByDepartmentId(id, user);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('update-position')
  async update(@Payload() data: any) {
    try {
      const { id, updatePositionDto, user } = data;
      const updatePosition = plainToInstance(UpdatePositionDto, updatePositionDto);
      const result = await this.positionService.update(id, updatePosition, user);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('remove-position')
  async remove(@Payload() data: any) {
    try {
      const { ids, user } = data;
      const result = await this.positionService.remove(ids, user);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }
}
