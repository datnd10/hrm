import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateDepartmentDto } from '@shared/dto/department/create-department.dto';
import { UpdateDepartmentDto } from '@shared/dto/department/update-department.dto';
import { Department } from '@shared/entities/department.entity';
import { User } from '@shared/entities/user.entity';
import { sendMessageKafka } from 'src/common/kafka.helper';

@Injectable()
export class DepartmentService {
  constructor(
    @Inject('COMPANY_SERVICE') private readonly companyClient: ClientProxy,
  ) { }

  async create(
    createDepartmentDto: CreateDepartmentDto,
    user: User,
  ): Promise<Department> {
    const payload = {
      createDepartmentDto,
      user,
    };
    return sendMessageKafka<Department>(
      this.companyClient,
      'add-department',
      JSON.stringify(payload),
    );
  }

  async findAll(user: User): Promise<Department[]> {
    return sendMessageKafka<Department[]>(
      this.companyClient,
      'find-all-department',
      { user },
    );
  }

  async findOne(id: number, user: User): Promise<Department> {
    return sendMessageKafka<Department>(
      this.companyClient,
      'find-one-department',
      { id, user },
    );
  }

  async findDepartmentByBranch(id: number): Promise<Department[]> {
    return sendMessageKafka<Department[]>(this.companyClient, 'find-department-by-branch', { id })
  }

  async update(id: number, updateDepartmentDto: UpdateDepartmentDto, user: User): Promise<Department> {
    return sendMessageKafka<Department>(this.companyClient, 'update-department', { id, updateDepartmentDto, user })
  }

  async remove(ids: number[], user: User): Promise<void> {
    return sendMessageKafka<void>(this.companyClient, 'remove-department', {
      ids,
      user,
    });
  }
}
