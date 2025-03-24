import { Inject, Injectable, } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreatePositionDto } from '@shared/dto/position/create-position.dto';
import { UpdatePositionDto } from '@shared/dto/position/update-position.dto';
import { Position } from '@shared/entities/position.entity';
import { User } from '@shared/entities/user.entity';
import { sendMessageKafka } from 'src/common/kafka.helper';

@Injectable()
export class PositionService {
  constructor(
    @Inject('COMPANY_SERVICE') private readonly companyClient: ClientProxy,
  ) { }

  async create(createPositionDto: CreatePositionDto, user: User): Promise<Position> {
    return sendMessageKafka<Position>(this.companyClient, 'add-position', { createPositionDto, user })
  }

  async filterPosition(user: User,
    paginationOptions: { page: number, limit: number },
    filters: { search: string, branchId?: number, departmentId?: number, sortBy: string, sortDirection: 'ASC' | 'DESC' }
  ): Promise<Position[]> {
    const message = { user, filters, paginationOptions }
    return sendMessageKafka<Position[]>(this.companyClient, 'filter-position', JSON.stringify(message))
  }

  async findAll(user: User): Promise<Position[]> {
    return sendMessageKafka<Position[]>(this.companyClient, 'find-all-position', { user })
  }

  async findOne(id: number, user: User): Promise<Position> {
    return sendMessageKafka<Position>(this.companyClient, 'find-one-position', { id, user })
  }

  async findByDepartmentId(id: number, user: User): Promise<Position[]> {
    return sendMessageKafka<Position[]>(this.companyClient, 'find-by-department-id', { id, user })
  }

  async update(id: number, updatePositionDto: UpdatePositionDto, user: User): Promise<Position> {
    return sendMessageKafka<Position>(this.companyClient, 'update-position', { id, updatePositionDto, user })
  }

  async remove(ids: number[], user: User): Promise<void> {
    return sendMessageKafka<void>(this.companyClient, 'remove-position', { ids, user })
  }
}
