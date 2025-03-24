import { BadRequestException, HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Expense } from '@shared/entities/expense.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateExpenseDto } from '@shared/dto/expense/create-expense.dto';
import { UpdateExpenseDto } from '@shared/dto/expense/update-expense.dto';
import { User } from '@shared/entities/user.entity';
import {
  IPaginationOptions,
  paginate,
  paginateRaw,
  Pagination,
} from 'nestjs-typeorm-paginate';
import { ExpenseItem } from '@shared/entities/expense-item.entity';
import { Branch } from '@shared/entities/branch.entity';
import { ExpenseType } from '@shared/entities/expense-type.entity';
import { Employee } from '@shared/entities/employee.entity';
import { Department } from '@shared/entities/department.entity';
import { ExpenseResponseDto } from '@shared/dto/expense/response-expense.dto'
import { CreateExpenseItemDto } from '@shared/dto/expense-item/create-expense-item';
import { ClientKafka } from '@nestjs/microservices';
import { BankAccount } from '@shared/entities/bank-account.entity';
import { ExpenseStatus, ExpenseTypeCategory, JobStatus, JobType, OwnerType } from '@shared/constants/enum';
import { Contract } from '@shared/entities/contract.entity';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Job } from '@shared/entities/job.entity';
import { JobItem } from '@shared/entities/job-item.entity';
import { ExpenseCategory } from '@shared/constants/enum';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectQueue('expense-queue') private readonly expenseQueue: Queue,

    @InjectRepository(ExpenseItem)
    private readonly expenseItemRepository: Repository<ExpenseItem>,

    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,

    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,

    @InjectRepository(ExpenseType)
    private readonly expenseTypeRepository: Repository<ExpenseType>,

    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,

    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,

    @InjectRepository(BankAccount)
    private readonly bankAccountRepository: Repository<BankAccount>,

    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,

    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,

    @InjectRepository(JobItem)
    private readonly jobItemRepository: Repository<JobItem>,

    @Inject('EXCEL_SERVICE') private readonly excelClient: ClientKafka,

    private readonly dataSource: DataSource,
  ) { }

  async onModuleInit() {
    console.log('Subscribing to Kafka topics...');
    this.excelClient.subscribeToResponseOf('export');
    this.excelClient.subscribeToResponseOf('import');
    await this.excelClient.connect();
    console.log('Kafka connected and subscribed to topics.');
  }


  // Kiểm tra sự tồn tại của Branch
  private async validateBranch(branchId: number): Promise<Branch> {
    const branch = await this.branchRepository.findOne({ where: { id: branchId } });
    if (!branch) throw new Error(`Chi nhánh không được tìm thấy`);
    return branch;
  }

  // Kiểm tra sự tồn tại của Bank Account
  private async validateBankAccount(bankAccountId: number): Promise<BankAccount> {
    const bankAccount = await this.bankAccountRepository.findOne({ where: { id: bankAccountId, ownerType: OwnerType.Company } });
    if (!bankAccount) throw new Error(`Ngân hàng không được tìm thấy`);
    return bankAccount;
  }

  // Kiểm tra Employee có thuộc Branch không
  private async validateEmployeeBranch(employeeId: number, branchId: number): Promise<Employee> {
    const user = await this.employeeRepository.findOne({
      where: { id: employeeId },
      relations: ['department'],
    });
    if (!user) throw new Error(`Người dùng không tồn tại.`);

    const department = await this.departmentRepository.findOne({
      where: { id: user.department.id },
      relations: ['branch'],
    });
    if (!department || department.branch.id !== branchId) {
      throw new Error(`Người dùng không thuộc chi nhánh này.`);
    }
    return user;
  }


  // Tạo một ExpenseItem entity với công thức tính toán
  private async createExpenseItemEntity(itemDto: CreateExpenseItemDto): Promise<ExpenseItem> {
    const { expenseTypeId, baseQuantity, quantity, price, discount, taxRate } = itemDto;
    const expenseType = await this.expenseTypeRepository.findOne({ where: { id: expenseTypeId }, relations: ['expenseRanges'], });
    if (!expenseType) throw new BadRequestException(`ExpenseType với id ${expenseTypeId} không tồn tại`);

    // Tính `totalAmount` của `expenseItem`
    const totalAmount = this.calculateTotalAmount(expenseType, baseQuantity, quantity, price, discount, taxRate);

    const expenseItemName = expenseType.name;

    return this.expenseItemRepository.create({
      ...itemDto,
      expenseItemName,
      expenseType,
      totalAmount,
    });
  }

  // Hàm tính toán `totalAmount` của từng `expenseItem`
  private calculateTotalAmount(expenseType: ExpenseType, baseQuantity: number, quantity: number, price: number, discount: number, taxRate: number): number {
    let totalAmount = 0;
    discount = discount ?? 0;
    taxRate = taxRate ?? 0;

    const { formulaType } = expenseType;
    switch (formulaType) {
      case 'BASE_SALARY':
        if (quantity > 0 && baseQuantity > 0) {
          totalAmount = (quantity * price) / baseQuantity;
        } else {
          totalAmount = 0; // Bỏ qua nếu quantity không lớn hơn 0 hoặc baseQuantity không hợp lệ
        }
        break;
      case 'FIXED_COST':
        totalAmount = quantity * price;
        break;
      case 'VARIABLE_COST':
        totalAmount = quantity * price;
        break;
      case 'TIERED_COST':
        // Sort the ranges by minRange
        const sortedRanges = expenseType.expenseRanges.sort((a, b) => a.minRange - b.minRange);

        for (const range of sortedRanges) {
          if (quantity <= 0) break; // Stop if there's no more quantity to account for

          // Determine the quantity applicable to the current range
          const rangeQuantity = Math.min(quantity, range.maxRange - range.minRange + 1);
          totalAmount += rangeQuantity * range.price;

          quantity -= rangeQuantity;
        }
        break;
      default:
        throw new BadRequestException(`Công thức tính toán không hợp lệ cho loại chi phí`);
    }
    // Áp dụng giảm giá và thuế
    return totalAmount * (1 - discount / 100) * (1 - taxRate / 100);
  }

  async create(createExpenseDto: CreateExpenseDto): Promise<Expense> {
    return await this.dataSource.transaction(async manager => {
      const { employeeId, branchId, expenseItems, expenseName, taxRate, type, bankAccountId, billingCycle } = createExpenseDto;
      const branch = await this.validateBranch(branchId);
      const employee = employeeId ? await this.validateEmployeeBranch(employeeId, branchId) : null;
      const bankAccount = bankAccountId ? await this.validateBankAccount(bankAccountId) : null;

      const expense = manager.create(Expense, { employee, expenseName, branch, taxRate, preTaxAmount: 0, totalAmount: 0, type, bankAccount, billingCycle });
      const savedExpense = await manager.save(expense);
      let preTaxAmount = 0;

      const expenseItemEntities = await Promise.all(
        expenseItems.map(async (itemDto) => {
          const expenseItem = await this.createExpenseItemEntity(itemDto);
          if (expenseItem.expenseType.type === ExpenseTypeCategory.DEDUCTION) {
            preTaxAmount -= expenseItem.totalAmount;
          }
          else {
            preTaxAmount += expenseItem.totalAmount;
          }
          return manager.create(ExpenseItem, { ...expenseItem, expense: savedExpense });
        }),
      );

      savedExpense.preTaxAmount = preTaxAmount;
      savedExpense.totalAmount = preTaxAmount * (1 - taxRate / 100);
      await manager.save(expenseItemEntities);
      await manager.save(savedExpense);

      return savedExpense;
    });
  }

  async update(expenseId: number, updateExpenseDto: UpdateExpenseDto, user: User): Promise<Expense> {
    const queryRunner = this.dataSource.createQueryRunner();

    // Bắt đầu transaction
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { employeeId, branchId, expenseItems, expenseName, taxRate, status, expenseDate, type, bankAccountId, billingCycle } = updateExpenseDto;
      console.log(updateExpenseDto);



      // Kiểm tra sự tồn tại của Expense và Branch
      const expense = await this.expenseRepository.findOne({ where: { id: expenseId } });
      if (!expense) throw new Error(`Expense với id ${expenseId} không tồn tại.`);

      if (expense.status === ExpenseStatus.APPROVED) {
        throw new HttpException(
          'Cập nhật chi phí thất bại: Không thể cập nhật các chi phí đã duyệt.',
          HttpStatus.FORBIDDEN
        );
      }

      const branch = await this.validateBranch(branchId);
      const employee = employeeId ? await this.validateEmployeeBranch(employeeId, branchId) : null;

      if (employeeId && !employee) {
        throw new Error(`Người dùng không tồn tại.`);
      }
      const bankAccount = await this.validateBankAccount(bankAccountId);

      // Cập nhật thông tin cơ bản của Expense
      if (employee) expense.employee = employee;
      if (expenseName) expense.expenseName = expenseName;
      if (billingCycle) expense.billingCycle = billingCycle;
      if (branch) expense.branch = branch;
      if (taxRate !== undefined) expense.taxRate = taxRate;
      if (status) expense.status = status;
      if (expenseDate) expense.expenseDate = new Date(expenseDate);
      if (type) expense.type = type;
      let preTaxAmount = 0;

      // Xóa các ExpenseItems cũ
      await queryRunner.manager.delete(ExpenseItem, { expense: { id: expenseId } });

      // Tạo mới ExpenseItems và tính toán preTaxAmount
      const expenseItemEntities = await Promise.all(
        expenseItems.map(async (itemDto) => {
          const expenseItem = await this.createExpenseItemEntity(itemDto);
          if (expenseItem.expenseType.type === ExpenseTypeCategory.DEDUCTION) {
            preTaxAmount -= expenseItem.totalAmount;
          }
          else {
            preTaxAmount += expenseItem.totalAmount;
          }

          // Thiết lập mối quan hệ giữa ExpenseItem và Expense đã lưu
          return queryRunner.manager.create(ExpenseItem, { ...expenseItem, expense });
        }),
      );

      // Tính toán totalAmount
      const totalAmount = preTaxAmount * (1 - taxRate / 100);

      // Cập nhật lại preTaxAmount và totalAmount cho Expense
      expense.preTaxAmount = preTaxAmount;
      expense.totalAmount = totalAmount;

      // Lưu Expense với các giá trị mới trong transaction
      const updatedExpense = await queryRunner.manager.save(expense);

      // Lưu các ExpenseItems trong transaction
      await queryRunner.manager.save(expenseItemEntities);

      // Commit transaction nếu thành công
      await queryRunner.commitTransaction();

      return updatedExpense;
    } catch (error) {
      // Rollback transaction nếu có lỗi
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Kết thúc transaction
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Expense[]> {
    return await this.expenseRepository.find({});
  }

  async filterExpense(
    user: User,
    options: IPaginationOptions,
    filters: {
      type: string;
      search: string;
      sortBy: string;
      branchId: number;
      status: string;
      sortDirection: 'ASC' | 'DESC';
      employeeId: number;
      billingCycle: string
    },
  ): Promise<Pagination<ExpenseResponseDto>> {
    const queryBuilder = this.expenseRepository.createQueryBuilder('expense')
      .select([
        'expense.id AS id',
        'expense.expenseName AS expenseName',
        'expense.billingCycle AS billingCycle',
        'expense.totalAmount AS totalAmount',
        'expense.taxRate AS taxRate',
        'expense.preTaxAmount AS preTaxAmount',
        'expense.expenseDate AS expenseDate',
        'expense.status AS status',
        'employee.id AS employeeId',
        'employee.fullName AS employeeName',
        'branch.id AS branchId',
        'branch.branchName AS branchName',
        'bankAccount.id AS bankAccountId',
        'bankAccount.bankName AS bankName',
        'bankAccount.accountNumber AS accountNumber',
        'bankAccount.accountName AS accountName',
      ])
      .leftJoin('expense.employee', 'employee', 'employee.deletedAt IS NULL') // Chỉ `LEFT JOIN` nếu cần
      .leftJoin('expense.bankAccount', 'bankAccount', 'bankAccount.deletedAt IS NULL')
      .innerJoin('expense.branch', 'branch', 'branch.deletedAt IS NULL') // Dùng `INNER JOIN` nếu bắt buộc có branch
      .where('expense.deletedAt IS NULL')
      .andWhere('branch.organizationId = :organizationId', { organizationId: user.organization.id })
      .andWhere('expense.type = :type', { type: filters.type })

    console.log(filters);

    // Áp dụng bộ lọc và sắp xếp như yêu cầu
    if (filters.search) {
      queryBuilder.andWhere('expense.expenseName LIKE :search', { search: `%${filters.search}%` });
    }
    if (filters.branchId) {
      queryBuilder.andWhere('branch.id = :branchId', { branchId: filters.branchId });
    }
    if (filters.status !== undefined) {
      queryBuilder.andWhere('expense.status = :status', { status: filters.status });
    }
    if (filters.employeeId) {
      queryBuilder.andWhere('employee.id = :employeeId', { employeeId: filters.employeeId });
    }
    if (filters.billingCycle) {
      queryBuilder.andWhere('expense.billingCycle = :search', { search: `${filters.billingCycle}` });
    }
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'employeeName':
          queryBuilder.orderBy('employee.fullName', filters.sortDirection);
          break;
        case 'branchName':
          queryBuilder.orderBy('branch.branchName', filters.sortDirection);
          break;
        default:
          queryBuilder.orderBy(`expense.${filters.sortBy}`, filters.sortDirection);
          break;
      }
    }

    // Sử dụng `paginateRaw` để thực hiện phân trang với `SelectQueryBuilder`
    const paginatedResults = await paginateRaw<Expense>(queryBuilder, options);

    const formattedResults = paginatedResults.items.map((expense: any) => ({
      id: expense.id,
      expenseName: expense.expenseName,
      billingCycle: expense.billingCycle,
      totalAmount: expense.totalAmount,
      taxRate: expense.taxRate,
      preTaxAmount: expense.preTaxAmount,
      expenseDate: expense.expenseDate,
      status: expense.status,
      type: expense.type,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      employee: expense.employeeId ? {
        id: expense.employeeId,
        fullName: expense.employeeName,
      } : null,
      branch: expense.branchId ? {
        id: expense.branchId,
        branchName: expense.branchName,
      } : null,
      bankAccount: expense.bankAccountId ? {
        id: expense.bankAccountId,
        bankName: expense.bankName,
        accountNumber: expense.accountNumber,
        accountName: expense.accountName,
      } : null,
    }));

    return {
      ...paginatedResults,
      items: formattedResults,
    };
  }


  async findOne(id: number, user: User): Promise<any> {
    // Sử dụng select để chỉ lấy các cột cần thiết
    const expense = await this.expenseRepository
      .createQueryBuilder('expense')
      .select([
        'expense.id',
        'expense.expenseName',
        'expense.totalAmount',
        'expense.taxRate',
        'expense.preTaxAmount',
        'expense.expenseDate',
        'expense.status',
        'expense.type',
        'expense.branchId',
        'expense.billingCycle',
      ])
      .addSelect(['expenseItem.id', 'expenseItem.expenseItemName', 'expenseItem.quantity', 'expenseItem.baseQuantity', 'expenseItem.taxRate', 'expenseItem.discount', 'expenseItem.price', 'expenseItem.totalAmount'])
      .addSelect(['employee.id', 'employee.fullName'])
      .addSelect(['department.id', 'department.departmentName'])
      .addSelect(['branch.id', 'branch.branchName'])
      .addSelect(['bankAccount.id', 'bankAccount.bankName', 'bankAccount.accountNumber', 'bankAccount.accountName'])
      .addSelect(['expenseType.type', 'expenseType.id', 'expenseType.formulaType'])
      .leftJoin('expense.expenseItems', 'expenseItem', 'expenseItem.deletedAt IS NULL')
      .leftJoin('expense.employee', 'employee', 'employee.deletedAt IS NULL')
      .leftJoin('employee.department', 'department', 'department.deletedAt IS NULL')
      .leftJoin('expense.bankAccount', 'bankAccount', 'bankAccount.deletedAt IS NULL')
      .leftJoin('expenseItem.expenseType', 'expenseType', 'expenseType.deletedAt IS NULL')
      .innerJoin('expense.branch', 'branch', 'branch.deletedAt IS NULL')
      .where('expense.deletedAt IS NULL')
      .andWhere('branch.organizationId = :organizationId', { organizationId: user.organization.id })
      .andWhere('expense.id = :id', { id })
      .getOne();

    // Kiểm tra nếu không tìm thấy expense
    if (!expense) {
      throw new Error(`Expense with id ${id} not found`);
    }

    // Trả về dữ liệu đã ánh xạ
    return this.mapExpenseResponse(expense);
  }

  // Helper để ánh xạ dữ liệu
  private mapExpenseResponse(expense: any): any {
    return {
      id: expense.id,
      billingCycle: expense.billingCycle,
      expenseName: expense.expenseName,
      totalAmount: expense.totalAmount,
      taxRate: expense.taxRate,
      preTaxAmount: expense.preTaxAmount,
      expenseDate: expense.expenseDate,
      status: expense.status,
      type: expense.type,
      employee: expense.employee
        ? {
          id: expense.employee.id,
          fullName: expense.employee.fullName,
        }
        : null,
      department: expense.employee?.department
        ? {
          id: expense.employee.department.id,
          departmentName: expense.employee.department.departmentName,
        }
        : null,
      branch: expense.branch
        ? {
          id: expense.branch.id,
          branchName: expense.branch.branchName,
        }
        : null,
      bankAccount: expense.bankAccount
        ? {
          id: expense.bankAccount.id,
          bankName: expense.bankAccount.bankName,
          accountNumber: expense.bankAccount.accountNumber,
          accountName: expense.bankAccount.accountName,
        }
        : null,
      expenseItems: expense.expenseItems?.map((item: any) => ({
        id: item.id,
        expenseItemName: item.expenseItemName,
        quantity: item.quantity,
        baseQuantity: item.baseQuantity,
        taxRate: item.taxRate,
        discount: item.discount,
        price: item.price,
        totalAmount: item.totalAmount,
        expenseType: item.expenseType.type,
        expenseTypeId: item.expenseType.id,
        formulaType: item.expenseType.formulaType
      })),
    };
  }


  async remove(
    ids: number[],
  ): Promise<{ deletedExpenseCount: number; notFoundExpenseCount: number }> {
    // Tìm các Expense theo danh sách ID
    const expenses = await this.expenseRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.expenseItems', 'expenseItem') // Lấy các expenseItem liên quan
      .where('expense.id IN (:...ids)', { ids })
      .getMany();

    // Lấy các ID của Expense đã tìm thấy
    const foundExpenseIds = expenses.map((exp) => exp.id);

    // Lọc ra các ID không tìm thấy
    const notFoundExpenseIds = ids.filter((id) => !foundExpenseIds.includes(id));

    // Nếu không tìm thấy bất kỳ Expense nào trong danh sách
    if (foundExpenseIds.length === 0) {
      throw new NotFoundException(`Không tìm thấy bất kỳ loại chi phí nào để xóa.`);
    }

    // Xóa mềm tất cả các Expense và các ExpenseItems liên quan
    await this.expenseRepository.softRemove(expenses);


    // Trả về số lượng Expense đã xóa và số lượng Expense không tìm thấy
    return {
      deletedExpenseCount: foundExpenseIds.length,
      notFoundExpenseCount: notFoundExpenseIds.length,
    };
  }

  async updateStatus(
    ids: number[],
    status: ExpenseStatus,
    expenseDate?: string,
    bankAccountId?: number
  ): Promise<{ updatedCount: number; updatedIds: number[] }> {
    // Find the Expenses by the provided IDs
    const expenses = await this.expenseRepository
      .createQueryBuilder('expense')
      .where('expense.id IN (:...ids)', { ids })
      .andWhere('expense.status != :approvedStatus', { approvedStatus: 'APPROVED' })
      .getMany();

    // Check if expenses is undefined or empty
    if (!expenses || expenses.length === 0) {
      throw new NotFoundException(`Không tìm thấy bất kỳ loại chi phí nào để cập nhật.`);
    }

    // Get the IDs of found Expenses
    const foundExpenseIds = expenses.map((exp) => exp.id);

    // Prepare the update data based on the status
    const updateData: Partial<Expense> = { status };

    if (status === ExpenseStatus.APPROVED) {
      if (!expenseDate || !bankAccountId) {
        throw new BadRequestException('Phải cung cấp expenseDate và bankAccountId khi trạng thái là APPROVED');
      }
      const bankAccount = await this.validateBankAccount(bankAccountId);
      updateData.expenseDate = new Date(expenseDate);
      updateData.bankAccount = bankAccount;
    }

    // Update the found Expenses with the provided data
    const result = await this.expenseRepository
      .createQueryBuilder()
      .update('Expense')
      .set(updateData)
      .where('id IN (:...foundExpenseIds)', { foundExpenseIds })
      .execute();

    // Return an object with updated count and IDs
    return {
      updatedCount: result.affected || 0,
      updatedIds: foundExpenseIds,
    };
  }
  async getHeaders(type: ExpenseCategory, user: User): Promise<any[]> {
    const query = `select name, type, id, basePrice, formulaType from expense_type where (type = "${type}" or type = "DEDUCTION") and deletedAt is null and organizationId = ${user.organization.id} ORDER BY 
      CASE 
        WHEN type = "${type}" THEN 1 
        WHEN type = "DEDUCTION" THEN 2 
      END;`;
    const headers = await this.dataSource.query(query);
    return headers;
  }


  async getSalaryTemplate(user: User, branch: number | string, type: ExpenseCategory, billingCycle: string) {
    if (branch !== 'all' && isNaN(Number(branch))) {
      throw new BadRequestException(
        'branch phải là "all" hoặc một số nguyên hợp lệ.'
      );
    }

    const branchIdNumber = branch === 'all' ? null : Number(branch);
    const expenseTypes = await this.getHeaders(type, user);

    const employees = await this.employeeRepository
      .createQueryBuilder('employee')
      .select([
        'employee.id',
        'employee.fullName',
        'department.id',
        'department.departmentName',
        'position.id',
        'position.positionName',
        'branch.id',
        'branch.branchName',
        'contract.id',
        'contract.salary',
      ])
      .leftJoin('employee.department', 'department', 'department.deletedAt IS NULL')
      .leftJoin('employee.position', 'position', 'position.deletedAt IS NULL')
      .innerJoin('employee.contracts', 'contract', 'contract.deletedAt IS NULL AND contract.status = "ACTIVE"')
      .leftJoin('department.branch', 'branch', 'branch.deletedAt IS NULL')
      .leftJoin('branch.organization', 'organization')
      .where('employee.deletedAt IS NULL')
      .andWhere('organization.id = :organizationId', { organizationId: user.organization.id })
      .andWhere(branch === 'all' ? '1=1' : 'branch.id = :branchId', { branchId: branchIdNumber })
      .orderBy('employee.createdAt', 'DESC')
      .getRawMany();

    const formattedResults = employees.map((employee: any) => ({
      employee: employee.employee_id ? {
        id: employee.employee_id,
        fullName: employee.employee_fullName,
      } : null,
      department: employee.department_id ? {
        id: employee.department_id,
        departmentName: employee.department_departmentName,
      } : null,
      position: employee.position_id ? {
        id: employee.position_id,
        positionName: employee.position_positionName,
      } : null,
      branch: employee.branch_id ? {
        id: employee.branch_id,
        branchName: employee.branch_id,
      } : null,
      salary: employee.contract_id ? employee.contract_salary : null
    }));

    const headers = [
      { name: 'Nhân viên', isPrice: 0 },
      { name: 'Chi nhánh', isPrice: 0 },
      { name: 'Phòng ban', isPrice: 0 },
      { name: 'Chức vụ', isPrice: 0 },
      { name: 'Kỳ thanh toán', isPrice: 0 },
      ...expenseTypes.map(expense => ({ id: expense.id, name: expense.name, type: expense.type, formulaType: expense.formulaType, basePrice: expense.basePrice ?? null, isPrice: 1 }))
    ];

    const entityMapping = {
      employee: "entity => `${entity.employee.fullName} (ID: ${entity.employee.id})`",
      branch: "entity => `${entity.branch.branchName} (ID: ${entity.branch.id})`",
      department: "entity => entity.department.departmentName",
      position: "entity => entity.position.positionName",
    };

    const title = `Bảng Tính Lương Tháng ${billingCycle}`;
    try {
      const result = await this.excelClient.send('export', { data: formattedResults, headers, title, entityMapping, type }).toPromise();
      return result;
    } catch (error) {
      throw new Error('Không thể gửi yêu cầu export');
    }
  }

  async exportSalary(user: User) {
    const queryBuilder = this.expenseRepository.createQueryBuilder('expense')
      .leftJoinAndSelect('expense.expenseItems', 'expenseItem', 'expenseItem.deletedAt IS NULL')
      .leftJoinAndSelect('expense.employee', 'employee', 'employee.deletedAt IS NULL')
      .leftJoinAndSelect('employee.department', 'department', 'department.deletedAt IS NULL')
      .innerJoinAndSelect('expense.branch', 'branch', 'branch.deletedAt IS NULL')
      .innerJoinAndSelect('employee.position', 'position', 'position.deletedAt IS NULL')
      .innerJoinAndSelect('branch.organization', 'organization')
      .where('expense.deletedAt IS NULL')
      .groupBy('expense.id')
      .select([
        'expense.id AS id',
        'expense.expenseName AS expenseName',
        'expense.billingCycle AS billingCycle',
        'expense.totalAmount AS totalAmount',
        'expense.taxRate AS taxRate',
        'expense.preTaxAmount AS preTaxAmount',
        'expense.expenseDate AS expenseDate',
        'expense.status AS status',
        'expense.createdAt AS createdAt',
        'expense.updatedAt AS updatedAt',
        'employee.id AS employeeId',
        'employee.fullName AS employeeName',
        'department.id AS departmentId',
        'department.departmentName AS departmentName',
        'branch.id AS branchId',
        'branch.branchName AS branchName',
        'position.id AS positionId',  // Thêm dòng này
        'position.positionName AS positionName'  // Thêm dòng này
      ])
      .addSelect(`
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', expenseItem.id,
            'expenseItemName', expenseItem.expenseItemName,
            'expenseTypeId', expenseItem.expenseTypeId,
            'amount', expenseItem.totalAmount,
            'quantity', expenseItem.quantity,
            'price', expenseItem.price,
            'baseQuantity', expenseItem.baseQuantity,
            'discount', expenseItem.discount,
            'taxRate', expenseItem.taxRate
          )
        )`, 'expenseItems')
      .andWhere('organization.id = :organizationId', { organizationId: user.organization.id })
      .andWhere('expense.type = :type', { type: ExpenseCategory.SALARY });;

    const employees = await queryBuilder.getRawMany();

    const formattedResults = employees.map((expense: any) => ({
      id: expense.id,
      billingCycle: expense.billingCycle,
      expenseName: expense.expenseName,
      totalAmount: expense.totalAmount,
      taxRate: expense.taxRate,
      preTaxAmount: expense.preTaxAmount,
      expenseDate: expense.expenseDate,
      status: expense.status,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      employee: expense.employeeId ? {
        id: expense.employeeId,
        fullName: expense.employeeName,
      } : null,
      department: expense.departmentId ? {
        id: expense.departmentId,
        departmentName: expense.departmentName,
      } : null,
      branch: expense.branchId ? {
        id: expense.branchId,
        branchName: expense.branchName,
      } : null,
      position: expense.positionId ? {
        id: expense.positionId,
        positionName: expense.positionName,
      } : null,
      expenseItems: typeof expense.expenseItems === 'string' ? JSON.parse(expense.expenseItems) : expense.expenseItems,
    }));

    const expenseTypes = await this.getHeaders(ExpenseCategory.SALARY, user);

    const headers = [
      { name: 'Nhân viên', isPrice: 0 },
      { name: 'Chi nhánh', isPrice: 0 },
      { name: 'Phòng ban', isPrice: 0 },
      { name: 'Chức vụ', isPrice: 0 },
      { name: 'Kỳ thanh toán', isPrice: 0 },
      ...expenseTypes.map(expense => ({ id: expense.id, name: expense.name, type: expense.type, formulaType: expense.formulaType, basePrice: expense.basePrice ?? null, isPrice: 1 })),
      { name: "Tiền trước thuế", isPrice: 0 },
      { name: "Thuế", isPrice: 0 },
      { name: "Tiền sau thuế", isPrice: 0 },
      { name: "Ngày thực chi", isPrice: 0 },
      { name: "Trạng thái", isPrice: 0 },
    ];
    const title = "Bảng lương"

    const entityMapping = {
      employee: "entity => `${entity.employee.fullName} (ID: ${entity.employee.id})`",
      branch: "entity => `${entity.branch.branchName} (ID: ${entity.branch.id})`",
      department: "entity => entity.department.departmentName",
      position: "entity => entity.position.positionName",
      billingCycle: `entity => entity.billingCycle`,
      expenseItems: "(entity, headerId) => { const item = entity.expenseItems.find(expenseItem => expenseItem.expenseTypeId === headerId); return { quantity: item?.quantity || 0, price: item?.price || 0, baseQuantity: item?.baseQuantity || 0 }; }",
      preTaxAmount: "entity => entity.preTaxAmount",
      taxRate: "entity => `${entity.taxRate}%`",
      totalAmount: "entity => entity.totalAmount",
      expenseDate: "entity => entity.expenseDate ? new Date(entity.expenseDate).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''",
      status: "entity => { switch (entity.status) { case 'PENDING': return 'Đang chờ'; case 'REJECTED': return 'Từ chối'; case 'APPROVED': return 'Đã duyệt'; default: return entity.status; }}",
    };

    try {
      const result = await this.excelClient.send('export', { data: formattedResults, headers, title, entityMapping, type: ExpenseCategory.SALARY }).toPromise();
      return result;
    } catch (error) {
      throw new Error('Không thể gửi yêu cầu export');
    }
  }

  async getExpenseTemplate(user: User, branch: number | string, type: ExpenseCategory, billingCycle: string) {

    const branches = await this.branchRepository.find({ where: { organization: user.organization } });

    const expenseTypes = await this.getHeaders(ExpenseCategory.OTHER, user);

    const headers = [
      { name: 'Chi nhánh', isPrice: 0 },
      { name: 'Tên chi phí', isPrice: 0 },
      { name: 'Kỳ thanh toán', isPrice: 0 },
      ...expenseTypes.map(expense => ({ id: expense.id, name: expense.name, type: expense.type, formulaType: expense.formulaType, basePrice: expense.basePrice ?? null, isPrice: 1 })),
    ];

    const entityMapping = {
      employee: "entity => `${entity.employee.fullName} (ID: ${entity.employee.id})`",
      branch: "entity => `${entity.branch.branchName} (ID: ${entity.branch.id})`",
      department: "entity => entity.department.departmentName",
      position: "entity => entity.position.positionName",
    };

    const title = `Bảng Chi Phí Tháng ${billingCycle}`;
    try {
      const result = await this.excelClient.send('export', { data: [], headers, title, entityMapping, type, branches }).toPromise();
      return result;
    } catch (error) {
      throw new Error('Không thể gửi yêu cầu export');
    }
  }

  async exportExpense(user: User) {
    const queryBuilder = this.expenseRepository.createQueryBuilder('expense')
      .leftJoinAndSelect('expense.expenseItems', 'expenseItem', 'expenseItem.deletedAt IS NULL')
      .innerJoinAndSelect('expense.branch', 'branch', 'branch.deletedAt IS NULL')
      .innerJoinAndSelect('branch.organization', 'organization')
      .where('expense.deletedAt IS NULL')
      .groupBy('expense.id')
      .select([
        'expense.id AS id',
        'expense.expenseName AS expenseName',
        'expense.billingCycle AS billingCycle',
        'expense.totalAmount AS totalAmount',
        'expense.taxRate AS taxRate',
        'expense.preTaxAmount AS preTaxAmount',
        'expense.expenseDate AS expenseDate',
        'expense.status AS status',
        'expense.createdAt AS createdAt',
        'expense.updatedAt AS updatedAt',
        'branch.id AS branchId',
        'branch.branchName AS branchName',
      ])
      .addSelect(`
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', expenseItem.id,
            'expenseItemName', expenseItem.expenseItemName,
            'expenseTypeId', expenseItem.expenseTypeId,
            'amount', expenseItem.totalAmount,
            'quantity', expenseItem.quantity,
            'price', expenseItem.price,
            'baseQuantity', expenseItem.baseQuantity,
            'discount', expenseItem.discount,
            'taxRate', expenseItem.taxRate
          )
        )`, 'expenseItems')
      .andWhere('organization.id = :organizationId', { organizationId: user.organization.id })
      .andWhere('expense.type = :type', { type: ExpenseCategory.OTHER });

    const employees = await queryBuilder.getRawMany();

    const branches = await this.branchRepository.find({ where: { organization: user.organization } });

    const formattedResults = employees.map((expense: any) => ({
      id: expense.id,
      billingCycle: expense.billingCycle,
      expenseName: expense.expenseName,
      totalAmount: expense.totalAmount,
      taxRate: expense.taxRate,
      preTaxAmount: expense.preTaxAmount,
      expenseDate: expense.expenseDate,
      status: expense.status,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      branch: expense.branchId ? {
        id: expense.branchId,
        branchName: expense.branchName,
      } : null,
      expenseItems: typeof expense.expenseItems === 'string' ? JSON.parse(expense.expenseItems) : expense.expenseItems,
    }));

    const expenseTypes = await this.getHeaders(ExpenseCategory.OTHER, user);

    const headers = [
      { name: 'Chi nhánh', isPrice: 0 },
      { name: 'Tên chi phí', isPrice: 0 },
      { name: 'Kỳ thanh toán', isPrice: 0 },
      ...expenseTypes.map(expense => ({ id: expense.id, name: expense.name, type: expense.type, formulaType: expense.formulaType, basePrice: expense.basePrice ?? null, isPrice: 1 })),
      { name: "Tiền trước thuế", isPrice: 0 },
      { name: "Thuế", isPrice: 0 },
      { name: "Tiền sau thuế", isPrice: 0 },
      { name: "Ngày thực chi", isPrice: 0 },
      { name: "Trạng thái", isPrice: 0 },
    ];
    const title = "Bảng chi phí";

    const entityMapping = {
      expenseName: "entity => entity.expenseName",
      branch: "entity => `${entity.branch.branchName} (ID: ${entity.branch.id})`",
      billingCycle: `entity => entity.billingCycle`,
      expenseItems: "(entity, headerId) => { const item = entity.expenseItems.find(expenseItem => expenseItem.expenseTypeId === headerId); return { quantity: item?.quantity || 0, price: item?.price || 0, baseQuantity: item?.baseQuantity || 0 }; }",
      preTaxAmount: "entity => entity.preTaxAmount",
      taxRate: "entity => `${entity.taxRate}%`",
      totalAmount: "entity => entity.totalAmount",
      expenseDate: "entity => entity.expenseDate ? new Date(entity.expenseDate).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''",
      status: "entity => { switch (entity.status) { case 'PENDING': return 'Đang chờ'; case 'REJECTED': return 'Từ chối'; case 'APPROVED': return 'Đã duyệt'; default: return entity.status; }}",
    };

    try {
      const result = await this.excelClient.send('export', { data: formattedResults, headers, title, entityMapping, type: ExpenseCategory.OTHER, branches }).toPromise();
      return result;
    } catch (error) {
      throw new Error('Không thể gửi yêu cầu export');
    }
  }


  async handleExcelProcessing(file: any, type: ExpenseCategory, user: User): Promise<any[]> {
    const headers = (await this.getHeaders(type, user)).map(header => ({
      ...header,
      isPrice: 1,
    }));
    try {
      // Gửi yêu cầu tới Excel Service để đọc file
      const jobType = type === "SALARY" ? JobType.IMPORT_SALARY_EXPENSE : JobType.IMPORT_OTHER_EXPENSE;
      const result = await this.excelClient
        .send('import', { buffer: file.buffer, headers, jobType })
        .toPromise();

      if (!result || result.length === 0) {
        throw new Error('No data returned from Excel Service');
      }

      return result;
    } catch (error) {
      throw new Error(`${error.message}`);
    }
  }

  async processImportJob(file: any, type: ExpenseCategory, user: User) {
    try {
      // Add job to the queue
      const job = await this.expenseQueue.add('process-import', { file, type, user });
      return job.id;
    } catch (error) {
      console.error('Error while adding job to the queue:', error);
      throw new Error('Failed to add job to the queue');
    }
  }

  async saveJob(name: string, type: JobType, user: User) {
    const logItem = this.jobRepository.create({
      name: name,
      type: type,
      organization: user.organization
    });
    return await this.jobRepository.save(logItem);
  }


  // Sử dụng repository.save để lưu log
  async saveLog(jobId: number, message: string, status: JobStatus) {
    const logItem = this.jobItemRepository.create({
      job: { id: jobId },
      message,
      status: status
    });
    await this.jobItemRepository.save(logItem);
  }

  // Sử dụng repository.save để cập nhật trạng thái job
  async updateJobStatus(jobId: number, status: JobStatus) {
    const job = await this.jobRepository.findOne({ where: { id: jobId } });
    if (job) {
      job.status = status;
      await this.jobRepository.save(job);  // Dùng repository.save để cập nhật job
    } else {
      throw new Error(`Job with id ${jobId} not found`);
    }
  }


  async validateExpenses(expense: any, type: ExpenseCategory): Promise<any> {

    try {
      // Kiểm tra branchId có tồn tại không
      const branch = await this.validateBranch(expense.branchId);

      if (type === ExpenseCategory.SALARY) {
        // Kiểm tra employeeId có thuộc branch không
        const employee = await this.validateEmployeeBranch(expense.employeeId, expense.branchId);
      }

      // Kiểm tra và lọc các expenseItems hợp lệ
      const validatedItems = await this.validateExpenseItems(expense.expenseItems);


      // Nếu tất cả hợp lệ, thêm expense vào mảng validatedExpenses
      return {
        ...expense,
        expenseItems: validatedItems, // Chỉ giữ lại các item hợp lệ
      };
    } catch (error) {
      // Nếu có bất kỳ lỗi nào, log lỗi và báo lỗi
      console.error(`Validation failed for expense with employeeId: ${expense.employeeId} -`, error.message);
      throw new Error(`Kiểm tra thất bại với nhân viên có Id là: ${expense.employeeId} - ${error.message}`);
    }
  }


  // Kiểm tra tính hợp lệ của expenseItems
  private async validateExpenseItems(expenseItems: any[]): Promise<any[]> {
    const validatedItems = [];

    for (const item of expenseItems) {
      // Kiểm tra xem expenseTypeId có tồn tại không
      const expenseType = await this.expenseTypeRepository.findOne({ where: { id: item.expenseTypeId } });
      if (!expenseType) throw new Error(`ExpenseType với id ${item.expenseTypeId} không tồn tại`);

      // Kiểm tra các giá trị baseQuantity, price, và quantity
      if (item.baseQuantity < 0 || item.price < 0 || item.quantity < 0) {
        throw new Error(`Giá trị không hợp lệ: baseQuantity, price, và quantity không được nhỏ hơn 0. `);
      }

      // Bỏ qua các item có price và quantity bằng 0
      if (item.quantity === 0) {
        continue; // Bỏ qua item này
      }

      validatedItems.push(item);
    }

    return validatedItems;
  }
}
