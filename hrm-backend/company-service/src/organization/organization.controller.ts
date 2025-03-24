import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from '@shared/dto/organization/create-organization.dto';
import { UpdateOrganizationDto } from '@shared/dto/organization/update-organization.dto';
import { handleError } from '@shared/util/error-handler';
import { plainToInstance } from 'class-transformer';


@Controller()
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) { }

  @MessagePattern('add-organization')
  async create(@Payload() payload: any) {
    try {
      const data = plainToInstance(CreateOrganizationDto, payload);
      const result = await this.organizationService.create(data);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('find-all-organization')
  async findAll() {
    try {
      const result = await this.organizationService.findAll();
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('find-one-organization')
  async findOne(@Payload() id: number) {
    try {
      const result = await this.organizationService.findOne(id);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('update-organization')
  async update(@Payload() data: any) {
    try {
      const { id, updateOrganizationDto } = data;
      const updateBranch = plainToInstance(UpdateOrganizationDto, updateOrganizationDto);
      const result = await this.organizationService.update(id, updateBranch);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('delete-organization')
  async remove(@Payload() id: number) {
    try {
      const result = await this.organizationService.remove(id);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }
}
