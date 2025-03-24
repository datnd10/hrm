import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ContractStatus } from '@shared/constants/enum';
import { CreateContractDto } from '@shared/dto/contract/create-contract.dto';
import { UpdateContractDto } from '@shared/dto/contract/update-contract.dto';
import { Contract } from '@shared/entities/contract.entity';
import { User } from '@shared/entities/user.entity';
import { sendMessageKafka } from 'src/common/kafka.helper';
@Injectable()
export class ContractService {
  constructor(
    @Inject('EMPLOYEE_SERVICE') private readonly employeeClient: ClientProxy,
  ) { }
  async create(
    createContractDto: CreateContractDto,
    user: User,
  ): Promise<Contract> {
    const payload = {
      createContractDto,
      user,
    };
    return sendMessageKafka<Contract>(
      this.employeeClient,
      'add-contract',
      JSON.stringify(payload),
    );
  }

  async findAll(user: User): Promise<Contract[]> {
    return sendMessageKafka<Contract[]>(
      this.employeeClient,
      'find-all-contract',
      { user },
    );
  }

  async filterContract(
    user: User,
    options: { page: number; limit: number },
    filters: {
      search: string;
      branchId: number;
      departmentId: number;
      positionId: number;
      status: ContractStatus;
      sortBy: string;
      sortDirection: 'ASC' | 'DESC';
    },
  ): Promise<Contract[]> {
    const message = { user, filters, options };
    return sendMessageKafka<Contract[]>(
      this.employeeClient,
      'filter-contract',
      JSON.stringify(message),
    );
  }

  async findOne(id: number, user: User): Promise<Contract> {
    return sendMessageKafka<Contract>(
      this.employeeClient,
      'find-one-contract',
      { id, user },
    );
  }

  async findByEmployee(id: number, user: User): Promise<Contract> {
    return sendMessageKafka<Contract>(
      this.employeeClient,
      'find-by-employee-contract',
      { id, user },
    );
  }

  async update(
    id: number,
    updateContractDto: UpdateContractDto,
    user: User,
  ): Promise<Contract> {
    return sendMessageKafka<Contract>(this.employeeClient, 'update-contract', {
      id,
      updateContractDto,
      user,
    });
  }

  async remove(id: number[], user: User): Promise<void> {
    return sendMessageKafka<void>(this.employeeClient, 'remove-contract', {
      id,
      user,
    });
  }
}
