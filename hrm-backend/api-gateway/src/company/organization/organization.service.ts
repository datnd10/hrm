import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateOrganizationDto } from '@shared/dto/organization/create-organization.dto';
import { UpdateOrganizationDto } from '@shared/dto/organization/update-organization.dto';
import { User } from '@shared/entities/user.entity';
import { Organization } from "@shared/entities/organization.entity";
import { sendMessageKafka } from 'src/common/kafka.helper';
@Injectable()
export class OrganizationService {
  constructor(
    @Inject('COMPANY_SERVICE') private readonly companyClient: ClientProxy,
  ) { }
  async create(createOrganizationDto: CreateOrganizationDto): Promise<Organization> {
    return sendMessageKafka<Organization>(this.companyClient, 'add-organization', JSON.stringify(createOrganizationDto));
  }

  async findAll(): Promise<Organization[]> {
    return sendMessageKafka<Organization[]>(this.companyClient, 'find-all-organization', '');
  }

  async findOne(id: number) {
    return sendMessageKafka<Organization>(this.companyClient, 'find-one-organization', id);
  }

  async update(id: number, updateOrganizationDto: UpdateOrganizationDto) {
    return sendMessageKafka<Organization>(this.companyClient, 'update-organization', { id, updateOrganizationDto });
  }

  async remove(id: number) {
    return sendMessageKafka<void>(this.companyClient, 'delete-organization', id);
  }
}
