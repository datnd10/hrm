import { Inject, Injectable, } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateBranchDto } from '@shared/dto/branch/create-branch.dto';
import { UpdateBranchDto } from '@shared/dto/branch/update-branch.dto';
import { Branch } from '@shared/entities/branch.entity';
import { User } from '@shared/entities/user.entity';
import { sendMessageKafka } from 'src/common/kafka.helper';



@Injectable()
export class BranchService {
  constructor(
    @Inject('COMPANY_SERVICE') private readonly companyClient: ClientProxy,
  ) { }

  async addBranch(createBranchDto: CreateBranchDto, user: User): Promise<Branch> {
    const payload = {
      branchData: createBranchDto,
      user: user  // Truyền cả đối tượng user
    };
    return sendMessageKafka<Branch>(this.companyClient, 'add-branch', JSON.stringify(payload));
  }

  async filterBranch(
    user: User,
    paginationOptions: { page: number, limit: number },
    filters: { search: string, isActive?: boolean, sortBy: string, sortDirection: 'ASC' | 'DESC' }
  ): Promise<Branch[]> {
    const message = { user, filters, paginationOptions };
    return sendMessageKafka<Branch[]>(this.companyClient, 'filter-branch', JSON.stringify(message));
  }

  async findAll(user: User): Promise<Branch[]> {
    return sendMessageKafka<Branch[]>(this.companyClient, 'find-all-branch', JSON.stringify(user));
  }



  async findOne(id: number, user: User): Promise<Branch> {
    return sendMessageKafka<Branch>(this.companyClient, 'find-one-branch', { id, user });
  }

  async updateBranch(updateBranchDto: UpdateBranchDto, id: number, user: User): Promise<Branch> {
    return sendMessageKafka<Branch>(this.companyClient, 'update-branch', { updateBranchDto, id, user });
  }

  async deleteBranch(ids: number[], user: User): Promise<void> {
    return sendMessageKafka<void>(this.companyClient, 'delete-branch', { ids, user });
  }
}
