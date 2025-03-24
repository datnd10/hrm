import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateBankAccountDto } from '@shared/dto/bank-account/create-bank-account.dto';
import { UpdateBankAccountDto } from '@shared/dto/bank-account/update-bank-account.dto';
import { BankAccount } from '@shared/entities/bank-account.entity';
import { Repository } from 'typeorm';
import { User } from '@shared/entities/user.entity'; // Nếu cần dùng User
import { BankAccountStatus, OwnerType } from '@shared/constants/enum';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';

@Injectable()
export class BankAccountService {
  constructor(
    @InjectRepository(BankAccount)
    private readonly bankAccountRepository: Repository<BankAccount>,
  ) { }

  async checkForDuplicateBankAccount(
    field: keyof CreateBankAccountDto,
    value: string,
    bankName: string,
    bankAccountId?: number,
  ): Promise<boolean> {
    const query = this.bankAccountRepository
      .createQueryBuilder('bankAccount')
      .where(`bankAccount.${field} = :value`, { value })
      .andWhere('bankAccount.bankName = :bankName', { bankName }) // Check within the same bankName
      .andWhere('bankAccount.deletedAt IS NULL');
    console.log(query.getSql());

    if (bankAccountId) {
      query.andWhere('bankAccount.id != :bankAccountId', { bankAccountId });
    }

    const existingBankAccount = await query.getOne();
    return !!existingBankAccount;
  }

  async create(createBankAccountDto: CreateBankAccountDto, user: User) {
    const {
      accountNumber,
      accountName,
      bankName,
      ownerType,
      balance,
      status,
      closingDate
    } = createBankAccountDto;

    let duplicateErrors = [];

    // Kiểm tra trùng lặp số tài khoản trong cùng một bankName
    const duplicateAccountNumber = await this.checkForDuplicateBankAccount(
      'accountNumber',
      accountNumber,
      bankName, // Pass bankName to check within the same bank
    );
    if (duplicateAccountNumber) {
      duplicateErrors.push({
        field: 'accountNumber',
        errors: [`Số tài khoản đã tồn tại trong ngân hàng ${bankName}.`],
      });
    }

    if (duplicateErrors.length > 0) {
      throw new HttpException(duplicateErrors, HttpStatus.CONFLICT);
    }

    // Tạo đối tượng BankAccount mới
    const bankAccount = this.bankAccountRepository.create({
      accountNumber,
      accountName,
      bankName,
      ownerId: user.organization.id,
      ownerType,
      balance,
      status,
      closingDate
    });

    return await this.bankAccountRepository.save(bankAccount);
  }

  async filterBank(
    user: User,
    options: IPaginationOptions,
    filters: {
      searchByAccountName: string;
      searchByBankName: string;
      sortBy: string;
      sortDirection: 'ASC' | 'DESC';
    },
  ): Promise<Pagination<BankAccount>> {
    // Tạo query builder cho việc lọc ExpenseTypeF
    const queryBuilder = this.bankAccountRepository
      .createQueryBuilder('bankAccount')
      .innerJoinAndSelect('organization', 'organization', 'bankAccount.ownerId = organization.id')
      .where('bankAccount.ownerType = :ownerType', { ownerType: OwnerType.Company })
      .andWhere('organization.id = :organizationId', { organizationId: user.organization.id })

    // Thêm bộ lọc tìm kiếm nếu có
    if (filters.searchByAccountName) {
      queryBuilder.andWhere('bankAccount.accountName LIKE :searchByAccountName', {
        searchByAccountName: `%${filters.searchByAccountName}%`,
      });
    }

    // Thêm bộ lọc isSalary nếu có
    if (filters.searchByBankName) {
      queryBuilder.andWhere('bankAccount.bankName = :searchByBankName', {
        searchByBankName: filters.searchByBankName,
      });
    }

    queryBuilder.orderBy(`bankAccount.${filters.sortBy}`, filters.sortDirection);

    // Thực hiện phân trang và trả về kết quả
    const paginatedResults = await paginate<BankAccount>(queryBuilder, options);


    // Trả về kết quả phân trang đã format
    return paginatedResults;
  }

  async findAll(user: User): Promise<BankAccount[]> {
    const query = this.bankAccountRepository
      .createQueryBuilder('bankAccount')
      .innerJoinAndSelect('organization', 'organization', 'bankAccount.ownerId = organization.id')
      .where('bankAccount.ownerType = :ownerType', { ownerType: OwnerType.Company })
      .andWhere('organization.id = :organizationId', { organizationId: user.organization.id })
    const result = await query.getMany();

    console.log('Query Result:', result);  // Log ra kết quả để kiểm tra

    return result;
  }

  async findOne(id: number, user: User): Promise<BankAccount> {
    console.log(id);

    const bankAccount = await this.bankAccountRepository
      .createQueryBuilder('bankAccount')
      .innerJoin('organization', 'organization', 'bankAccount.ownerId = organization.id')
      .where('bankAccount.id = :id', { id })
      .andWhere('bankAccount.ownerType = :ownerType', { ownerType: OwnerType.Company })
      .andWhere('organization.id = :organizationId', { organizationId: user.organization.id })
      .getOne();


    if (!bankAccount) {
      throw new NotFoundException(`Tài khoản ngân hàng không tồn tại hoặc không thuộc tổ chức của bạn.`);
    }

    return bankAccount;
  }


  async update(
    id: number,
    updateBankAccountDto: UpdateBankAccountDto,
    user: User,
  ): Promise<BankAccount> {
    const bankAccount = await this.findOne(id, user);

    const {
      accountNumber,
      accountName,
      bankName,
      ownerType,
      balance,
      closingDate
    } = updateBankAccountDto;

    let duplicateErrors = [];

    if (accountNumber && bankName) {
      // Kiểm tra trùng lặp số tài khoản trong cùng một bankName
      const existingBankAccountByAccountNumber =
        await this.checkForDuplicateBankAccount(
          'accountNumber',
          accountNumber,
          bankName, // Pass bankName to ensure unique within the same bank
          id, // Exclude the current bank account being updated
        );
      if (existingBankAccountByAccountNumber) {
        duplicateErrors.push({
          field: 'accountNumber',
          errors: [`Số tài khoản đã tồn tại trong ngân hàng ${bankName}.`],
        });
      }
    }

    if (duplicateErrors.length > 0) {
      throw new HttpException(duplicateErrors, HttpStatus.CONFLICT);
    }

    // Cập nhật các thông tin của tài khoản ngân hàng
    if (accountNumber) bankAccount.accountNumber = accountNumber;
    if (accountName) bankAccount.accountName = accountName;
    if (bankName) bankAccount.bankName = bankName;
    if (ownerType !== undefined) bankAccount.ownerType = ownerType;
    if (balance !== undefined) bankAccount.balance = balance;
    if (closingDate !== undefined) bankAccount.closingDate = closingDate;

    return await this.bankAccountRepository.save(bankAccount);
  }

  async remove(ids: number[]): Promise<{
    deletedBankAccountCount: number;
    notFoundBankAccountCount: number;
  }> {
    const bankAccounts = await this.bankAccountRepository
      .createQueryBuilder('bankAccount')
      .where('bankAccount.id IN (:...ids)', { ids })
      .getMany();

    const foundBankAccountIds = bankAccounts.map((acc) => acc.id);
    const notFoundBankAccountIds = ids.filter(
      (id) => !foundBankAccountIds.includes(id),
    );

    if (foundBankAccountIds.length === 0) {
      throw new NotFoundException(
        `Không tìm thấy tài khoản ngân hàng nào để xóa.`,
      );
    }

    await this.bankAccountRepository.softRemove(bankAccounts);

    return {
      deletedBankAccountCount: foundBankAccountIds.length,
      notFoundBankAccountCount: notFoundBankAccountIds.length,
    };
  }
}
