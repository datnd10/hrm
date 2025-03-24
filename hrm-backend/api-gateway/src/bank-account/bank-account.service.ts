import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateBankAccountDto } from '@shared/dto/bank-account/create-bank-account.dto';
import { UpdateBankAccountDto } from '@shared/dto/bank-account/update-bank-account.dto';
import { BankAccount } from '@shared/entities/bank-account.entity';
import { User } from '@shared/entities/user.entity';
import { sendMessageKafka } from 'src/common/kafka.helper';

@Injectable()
export class BankAccountService {
  constructor(
    @Inject('BANK_ACCOUNT_SERVICE')
    private readonly bankAccountClient: ClientProxy,
  ) { }

  async filterBank(
    user: User,
    paginationOptions: { page: number, limit: number },
    filters: { searchByAccountName: string, searchByBankName: string, sortBy: string, sortDirection: 'ASC' | 'DESC' }
  ): Promise<BankAccount[]> {
    const message = { user, filters, paginationOptions };
    return sendMessageKafka<BankAccount[]>(this.bankAccountClient, 'filter-bank-account', JSON.stringify(message));
  }

  async create(
    createBankAccountDto: CreateBankAccountDto,
    user: User,
  ): Promise<BankAccount> {
    // Thêm logic xử lý liên quan đến user nếu cần
    return sendMessageKafka<BankAccount>(
      this.bankAccountClient,
      'add-bank-account',
      JSON.stringify({ createBankAccountDto, user }),
    );
  }

  async findAll(user: User): Promise<BankAccount[]> {
    // Thêm logic xử lý liên quan đến user nếu cần
    return sendMessageKafka<BankAccount[]>(
      this.bankAccountClient,
      'find-all-bank-account',
      { user },
    );
  }

  async findOne(id: number, user: User): Promise<BankAccount> {
    // Thêm logic xử lý liên quan đến user nếu cần
    return sendMessageKafka<BankAccount>(
      this.bankAccountClient,
      'find-one-bank-account',
      { id, user },
    );
  }

  async update(
    id: number,
    updateBankAccountDto: UpdateBankAccountDto,
    user: User,
  ): Promise<BankAccount> {
    // Thêm logic xử lý liên quan đến user nếu cần
    return sendMessageKafka<BankAccount>(
      this.bankAccountClient,
      'update-bank-account',
      {
        id,
        updateBankAccountDto,
        user,
      },
    );
  }

  async remove(ids: number[], user: User): Promise<void> {
    // Thêm logic xử lý liên quan đến user nếu cần
    return sendMessageKafka<void>(
      this.bankAccountClient,
      'remove-bank-account',
      { ids, user },
    );
  }
}
