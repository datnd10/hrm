import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateEmployeeDto } from '@shared/dto/employee/create-employee.dto';
import { UpdateEmployeeDto } from '@shared/dto/employee/update-employee.dto';
import { Department } from '@shared/entities/department.entity';
import { Employee } from '@shared/entities/employee.entity';
import { BankAccount } from '@shared/entities/bank-account.entity';
import { Position } from '@shared/entities/position.entity';
import { User } from '@shared/entities/user.entity'; // Thêm nếu cần dùng User
import { Brackets, In, Not, Repository } from 'typeorm';
import { RelationFormatterService } from '@shared/util/relation-formatter.service';
import { ClientKafka } from '@nestjs/microservices';
import {
  IPaginationOptions,
  paginate,
  paginateRaw,
  Pagination,
} from 'nestjs-typeorm-paginate';
import { EmployeeResponseDto } from '@shared/dto/employee/employee-response.dto';
import { firstValueFrom } from 'rxjs';
import { BankAccountStatus, OwnerType } from '@shared/constants/enum';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,

    @InjectRepository(BankAccount)
    private readonly bankAccountRepository: Repository<BankAccount>,

    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,

    @InjectRepository(Position)
    private readonly positionRepository: Repository<Position>,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientKafka,
  ) { }

  async onModuleInit() {
    this.authClient.subscribeToResponseOf('create-user');
    this.authClient.subscribeToResponseOf('update-infomation');
    await this.authClient.connect();
  }

  async checkForDuplicateEmployee(
    field: keyof CreateEmployeeDto,
    value: string,
    employeeId?: number,
  ): Promise<boolean> {
    const query = this.employeeRepository
      .createQueryBuilder('employee')
      .where(`employee.${field} = :value`, { value })
      .andWhere('employee.deletedAt IS NULL');

    if (employeeId) {
      query.andWhere('employee.id != :employeeId', { employeeId });
    }

    const existingEmployee = await query.getOne();
    return !!existingEmployee;
  }

  async create(createEmployeeDto: CreateEmployeeDto, user: User) {
    const {
      fullName,
      gender,
      dateOfBirth,
      idCard,
      taxCode,
      email,
      phoneNumber,
      province,
      district,
      ward,
      specificAddress,
      avatar,
      departmentId,
      password,
      roleId,
      positionId,
      accountNumber,
      accountName,
      bankName,
      accountId,
    } = createEmployeeDto;

    let duplicateErrors = [];

    const department = await this.departmentRepository.findOne({
      where: { id: departmentId },
    });
    if (!department) {
      duplicateErrors.push({
        field: 'departmentId',
        errors: ['Phòng ban không tồn tại trong hệ thống.'],
      });
    }

    const position = await this.positionRepository.findOne({
      where: { id: positionId },
    });
    if (!position) {
      duplicateErrors.push({
        field: 'positionId',
        errors: ['Chức vụ không tồn tại trong hệ thống.'],
      });
    }

    const duplicateIdCard = await this.checkForDuplicateEmployee(
      'idCard',
      idCard,
    );
    if (duplicateIdCard) {
      duplicateErrors.push({
        field: 'idCard',
        errors: [`Số CMND/CCCD '${idCard}' đã tồn tại trong hệ thống.`],
      });
    }

    const duplicateTaxCode = await this.checkForDuplicateEmployee(
      'taxCode',
      taxCode,
    );
    if (duplicateTaxCode) {
      duplicateErrors.push({
        field: 'taxCode',
        errors: [`Mã số thuế '${taxCode}' đã tồn tại trong hệ thống.`],
      });
    }

    const duplicateEmail = await this.checkForDuplicateEmployee('email', email);
    if (duplicateEmail) {
      duplicateErrors.push({
        field: 'email',
        errors: [`Email '${email}' đã tồn tại trong hệ thống.`],
      });
    }

    const duplicatePhoneNumber = await this.checkForDuplicateEmployee(
      'phoneNumber',
      phoneNumber,
    );
    if (duplicatePhoneNumber) {
      duplicateErrors.push({
        field: 'phoneNumber',
        errors: [`Số điện thoại '${phoneNumber}' đã tồn tại trong hệ thống.`],
      });
    }

    // Nếu có lỗi trùng lặp, ném ra một HttpException với tất cả các lỗi
    if (duplicateErrors.length > 0) {
      throw new HttpException(duplicateErrors, HttpStatus.CONFLICT);
    }

    let userId;
    try {
      const createUser: any = await firstValueFrom(
        this.authClient.send('create-user', {
          email: email,
          roleId: roleId,
          password: password,
          organizationId: user.organization.id,
          organizationName: user.organization.organizationName,
        }),
      );
      userId = createUser.id;
    } catch (error) {
      console.log(error);
    }

    // Tạo nhân viên mới sau khi kiểm tra trùng lặp
    const employee = this.employeeRepository.create({
      fullName,
      gender,
      dateOfBirth,
      idCard,
      taxCode,
      email,
      phoneNumber,
      province,
      district,
      ward,
      specificAddress,
      avatar: avatar || '',
      department,
      position,
      user: { id: userId },
    });

    const savedEmployee = await this.employeeRepository.save(employee);

    // Tạo tài khoản ngân hàng cho nhân viên
    const bankAccount = this.bankAccountRepository.create({
      accountNumber,
      accountName,
      bankName,
      ownerId: savedEmployee.id,
      ownerType: OwnerType.User,
    });

    await this.bankAccountRepository.save(bankAccount);

    return savedEmployee;
  }

  async findAll(user: User): Promise<Employee[]> {
    const employees = await this.employeeRepository
      .createQueryBuilder('employee')
      .innerJoinAndSelect('employee.department', 'department')
      .innerJoinAndSelect('employee.position', 'position')
      .innerJoinAndSelect('department.branch', 'branch')
      .innerJoinAndSelect('branch.organization', 'organization')
      .innerJoinAndSelect('employee.user', 'user')
      .where('organization.id = :organizationId', {
        organizationId: user.organization.id,
      })
      .getMany();
    return employees;
  }

  async filterEmployee(
    user: User,
    options: IPaginationOptions,
    filters: {
      search: string;
      branchId?: number;
      departmentId?: number;
      positionId?: number;
      roleId?: number;
      sortBy: string;
      sortDirection: 'ASC' | 'DESC';
    },
  ): Promise<Pagination<any>> {
    // Tạo query builder
    const queryBuilder = this.employeeRepository
      .createQueryBuilder('employee')
      .innerJoinAndSelect('employee.department', 'department')
      .innerJoinAndSelect('employee.position', 'position')
      .innerJoinAndSelect('department.branch', 'branch')
      .innerJoinAndSelect('branch.organization', 'organization')
      .innerJoinAndSelect('employee.user', 'user')
      .where('organization.id = :organizationId', {
        organizationId: user.organization.id,
      })

    // Lọc theo branchId nếu có
    if (filters.branchId) {
      queryBuilder.andWhere('branch.id = :branchId', {
        branchId: filters.branchId,
      });
    }

    // Lọc theo departmentId nếu có
    if (filters.departmentId) {
      queryBuilder.andWhere('department.id = :departmentId', {
        departmentId: filters.departmentId,
      });
    }

    // Lọc theo positionId nếu có
    if (filters.positionId) {
      queryBuilder.andWhere('position.id = :positionId', {
        positionId: filters.positionId,
      });
    }

    // Lọc theo roleId nếu có
    if (filters.roleId) {
      queryBuilder.andWhere('user.roleId = :roleId', {
        roleId: filters.roleId,
      });
    }

    // Tìm kiếm theo tên employee nếu có search
    if (filters.search) {
      queryBuilder.andWhere('employee.fullName LIKE :search', {
        search: `%${filters.search}%`,
      });
    }

    // Sắp xếp theo filters.sortBy
    switch (filters.sortBy) {
      case 'departmentName':
        queryBuilder.orderBy(
          'department.departmentName',
          filters.sortDirection,
        );
        break;
      case 'branchName':
        queryBuilder.orderBy('branch.branchName', filters.sortDirection);
        break;
      case 'positionName':
        queryBuilder.orderBy('position.positionName', filters.sortDirection);
        break;
      case 'role':
        queryBuilder.orderBy('user.roleId', filters.sortDirection);
        break;
      default:
        queryBuilder.orderBy(
          `employee.${filters.sortBy}`,
          filters.sortDirection,
        );
        break;
    }

    // Thực hiện phân trang và trả về kết quả
    const paginatedResults = await paginate<Employee>(queryBuilder, options);

    const formattedResults = paginatedResults.items.map((employee: any) => {
      return {
        id: employee.id,
        fullName: employee.fullName,
        gender: employee.gender,
        dateOfBirth: employee.dateOfBirth,
        idCard: employee.idCard,
        taxCode: employee.taxCode,
        email: employee.email,
        phoneNumber: employee.phoneNumber,
        province: employee.province,
        district: employee.district,
        ward: employee.ward,
        specificAddress: employee.specificAddress,
        avatar: employee.avatar,
        user: {
          id: employee.user.id,
          roleId: employee.user.roleId,
        },
        position: {
          id: employee.position.id,
          positionName: employee.position.positionName,
        },
        department: {
          id: employee.department.id,
          departmentName: employee.department.departmentName,
        },
        branch: {
          id: employee.department.branch.id,
          branchName: employee.department.branch.branchName,
        },
      };
    });
    // Trả về kết quả đã định dạng
    return {
      ...paginatedResults,
      items: formattedResults,
    };
  }

  async findOne(id: number, user: User): Promise<Employee> {
    const employee = await this.employeeRepository
      .createQueryBuilder('employee')
      .innerJoinAndSelect('employee.department', 'department')
      .innerJoinAndSelect('employee.position', 'position')
      .innerJoinAndSelect('department.branch', 'branch')
      .innerJoinAndSelect('employee.user', 'user')
      .where('employee.id = :id', { id })
      .andWhere('branch.organizationId = :organizationId', {
        organizationId: user.organization.id,
      })
      .getOne();

    // If employee not found, throw a 404 NotFoundException
    if (!employee) {
      throw new NotFoundException(
        `Nhân viên không được tìm thấy trong hệ thống.`,
      );
    }

    // Define the relation fields for formatting
    const relationFields = {
      department: ['id', 'departmentName'],
      position: ['id', 'positionName'],
      branch: ['id', 'branchName'],
      user: ['id', 'roleId'],
    };

    // Use RelationFormatterService to format the employee data
    const relationFormatterService = new RelationFormatterService();
    return relationFormatterService.formatRelations(employee, relationFields);
  }

  async getOneEmployee(id: number, user: User): Promise<EmployeeResponseDto> {
    const employee: any = await this.employeeRepository
      .createQueryBuilder('employee')
      .innerJoinAndSelect('employee.department', 'department')
      .innerJoinAndSelect('employee.position', 'position')
      .innerJoinAndSelect('department.branch', 'branch')
      .innerJoinAndSelect('branch.organization', 'organization')
      .innerJoinAndSelect('employee.user', 'user')
      .leftJoinAndMapMany(
        'employee.bankAccounts',
        'bank-account',
        'bankAccount',
        'bankAccount.ownerType = :ownerType AND bankAccount.ownerId = employee.id',
        { ownerType: 'User' },
      )
      .where('employee.id = :id', { id })
      .andWhere('organization.id = :organizationId', {
        organizationId: user.organization.id,
      })
      .getOne();

    // If employee not found, throw a 404 NotFoundException
    if (!employee) {
      throw new NotFoundException(
        `Nhân viên không được tìm thấy trong hệ thống.`,
      );
    }

    // Format and return the employee data
    return {
      id: employee.id,
      fullName: employee.fullName,
      gender: employee.gender,
      dateOfBirth: employee.dateOfBirth,
      idCard: employee.idCard,
      taxCode: employee.taxCode,
      email: employee.email,
      phoneNumber: employee.phoneNumber,
      province: employee.province,
      district: employee.district,
      ward: employee.ward,
      specificAddress: employee.specificAddress,
      avatar: employee.avatar,
      user: {
        id: employee.user.id,
        roleId: employee.user.roleId,
      },
      position: {
        id: employee.position.id,
        positionName: employee.position.positionName,
      },
      department: {
        id: employee.department.id,
        departmentName: employee.department.departmentName,
      },
      branch: {
        id: employee.department.branch.id,
        branchName: employee.department.branch.branchName,
      },
      bankAccount: {
        id: employee?.bankAccounts[0]?.id,
        accountNumber: employee?.bankAccounts[0]?.accountNumber,
        accountName: employee?.bankAccounts[0]?.accountName,
        bankName: employee?.bankAccounts[0]?.bankName,
      },
    };
  }

  async findEmployeeByDepartment(
    departmentId: number,
    user: User,
  ): Promise<Employee[]> {
    return await this.employeeRepository
      .createQueryBuilder('employee')
      .select([
        'employee.id',
        'employee.fullName',
        'position.id',
        'position.positionName',
        'department.id',
        'department.departmentName',
        'branch.id',
        'branch.branchName',
      ]) // Chỉ lấy các trường cần thiết
      .innerJoin('employee.department', 'department')
      .innerJoin('employee.position', 'position')
      .innerJoin('department.branch', 'branch')
      .where('department.id = :departmentId', { departmentId })
      .andWhere('branch.organizationId = :organizationId', {
        organizationId: user.organization.id,
      })
      .getMany();
  }


  async findEmployeeByBranch(
    branchId: number,
    user: User,
  ): Promise<{ employeeId: number; fullName: string }[]> {
    const employees = await this.employeeRepository
      .createQueryBuilder('employee')
      .select(['employee.id AS id', 'employee.fullName AS fullName']) // Chỉ chọn các trường cần thiết
      .innerJoin('employee.department', 'department')
      .innerJoin('department.branch', 'branch')
      .where('branch.id = :branchId', { branchId })
      .andWhere('branch.organizationId = :organizationId', {
        organizationId: user.organization.id,
      })
      .getRawMany(); // Lấy dữ liệu thô để phù hợp với alias

    return employees;
  }

  // Hàm cập nhật tài khoản ngân hàng
  private async updateBankAccount(
    accountId: number | null,
    employeeId: number,
    accountNumber: string,
    accountName: string,
    bankName: string,
  ): Promise<void> {
    if (accountId) {
      // Cập nhật tài khoản ngân hàng nếu đã tồn tại
      const existingBankAccount = await this.bankAccountRepository.findOne({
        where: { id: accountId },
      });

      if (!existingBankAccount) {
        throw new NotFoundException(
          `Không tìm thấy tài khoản ngân hàng với ID: ${accountId}`,
        );
      }

      existingBankAccount.accountNumber =
        accountNumber || existingBankAccount.accountNumber;
      existingBankAccount.accountName =
        accountName || existingBankAccount.accountName;
      existingBankAccount.bankName = bankName || existingBankAccount.bankName;

      await this.bankAccountRepository.save(existingBankAccount);
      console.log(`Tài khoản ngân hàng với ID ${accountId} đã được cập nhật.`);
    } else {
      // Tạo mới tài khoản ngân hàng nếu không có accountId
      const newBankAccount = this.bankAccountRepository.create({
        accountNumber,
        accountName,
        bankName,
        ownerId: employeeId,
        ownerType: OwnerType.User,
      });

      await this.bankAccountRepository.save(newBankAccount);
      console.log('Tài khoản ngân hàng mới đã được tạo.');
    }
  }

  async update(
    id: number,
    updateEmployeeDto: UpdateEmployeeDto,
    user: User,
  ): Promise<Employee> {
    // Tìm nhân viên theo ID và lọc theo organizationId
    const employee = await this.findOne(id, user);
    if (!employee) {
      throw new NotFoundException(`Nhân viên không tồn tại trong hệ thống.`);
    }

    const {
      fullName,
      gender,
      dateOfBirth,
      idCard,
      taxCode,
      email,
      phoneNumber,
      district,
      province,
      ward,
      specificAddress,
      avatar,
      departmentId,
      positionId,
      roleId,
      accountNumber,
      accountName,
      bankName,
      accountId,
    } = updateEmployeeDto;

    let duplicateErrors = [];

    if (email) {
      const existingEmployeeByEmail = await this.checkForDuplicateEmployee(
        'email',
        email,
        id,
      );
      if (existingEmployeeByEmail) {
        duplicateErrors.push({
          field: 'email',
          errors: ['Email đã tồn tại trong hệ thống.'],
        });
      }
    }

    if (idCard) {
      const existingEmployeeByIdCard = await this.checkForDuplicateEmployee(
        'idCard',
        idCard,
        id,
      );
      if (existingEmployeeByIdCard) {
        duplicateErrors.push({
          field: 'idCard',
          errors: ['Số CMND/CCCD đã tồn tại trong hệ thống.'],
        });
      }
    }

    if (taxCode) {
      const existingEmployeeByTaxCode = await this.checkForDuplicateEmployee(
        'taxCode',
        taxCode,
        id,
      );
      if (existingEmployeeByTaxCode) {
        duplicateErrors.push({
          field: 'taxCode',
          errors: ['Mã số thuế đã tồn tại trong hệ thống.'],
        });
      }
    }

    if (phoneNumber) {
      const existingEmployeeByPhoneNumber =
        await this.checkForDuplicateEmployee('phoneNumber', phoneNumber, id);
      if (existingEmployeeByPhoneNumber) {
        duplicateErrors.push({
          field: 'phoneNumber',
          errors: ['Số điện thoại đã tồn tại trong hệ thống.'],
        });
      }
    }

    if (duplicateErrors.length > 0) {
      throw new HttpException(duplicateErrors, HttpStatus.CONFLICT);
    }

    if (departmentId) {
      const department = await this.departmentRepository.findOne({
        where: { id: departmentId },
      });
      if (!department) {
        duplicateErrors.push({
          field: 'departmentId',
          errors: ['Phòng ban không tồn tại trong hệ thống.'],
        });
      } else {
        employee.department = department;
      }
    }

    if (positionId) {
      const position = await this.positionRepository.findOne({
        where: { id: positionId },
      });
      if (!position) {
        duplicateErrors.push({
          field: 'positionId',
          errors: ['Chức vụ không tồn tại trong hệ thống.'],
        });
      } else {
        employee.position = position;
      }
    }

    if (duplicateErrors.length > 0) {
      throw new HttpException(duplicateErrors, HttpStatus.CONFLICT);
    }

    if (fullName) employee.fullName = fullName;
    if (idCard) employee.idCard = idCard;
    if (taxCode) employee.taxCode = taxCode;
    if (email) employee.email = email;
    if (phoneNumber) employee.phoneNumber = phoneNumber;
    if (departmentId) employee.department.id = departmentId;
    if (positionId) employee.position.id = positionId;
    if (gender) employee.gender = gender;
    if (dateOfBirth) employee.dateOfBirth = dateOfBirth;
    if (province) employee.province = province;
    if (district) employee.district = district;
    if (ward) employee.ward = ward;
    if (specificAddress) employee.specificAddress = specificAddress;
    if (avatar) employee.avatar = avatar;

    console.log('lll', employee);

    const data = { email: email, roleId: roleId };

    try {
      const userData = { updateDto: data, id: employee.user.id };
      const createUser: any = await firstValueFrom(
        this.authClient.send('update-infomation', userData),
      );
      console.log(createUser);
    } catch (error) {
      console.log(error);
    }
    // Cập nhật hoặc tạo mới tài khoản ngân hàng
    if (accountNumber || accountName || bankName) {
      try {
        await this.updateBankAccount(
          accountId,
          employee.id,
          accountNumber,
          accountName,
          bankName,
        );
      } catch (error) {
        console.error('Lỗi khi cập nhật tài khoản ngân hàng:', error.message);
        throw new HttpException(
          'Không thể cập nhật tài khoản ngân hàng. Vui lòng thử lại.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    return await this.employeeRepository.save(employee);
  }

  async remove(
    ids: number[],
    user: User,
  ): Promise<{ deletedEmployeeCount: number; notFoundEmployeeCount: number }> {
    // Tìm các nhân viên theo danh sách ID và lọc theo organizationId
    const employees = await this.employeeRepository
      .createQueryBuilder('employee')
      .innerJoinAndSelect('employee.department', 'department')
      .innerJoinAndSelect('department.branch', 'branch')
      .innerJoinAndSelect('branch.organization', 'organization')
      .where('employee.id IN (:...ids)', { ids })
      .andWhere('organization.id = :organizationId', {
        organizationId: user.organization.id,
      })
      .getMany();

    // Lấy các ID của nhân viên đã tìm thấy
    const foundEmployeeIds = employees.map((emp) => emp.id);

    // Lọc ra các ID không tìm thấy
    const notFoundEmployeeIds = ids.filter(
      (id) => !foundEmployeeIds.includes(id),
    );

    // Nếu không tìm thấy bất kỳ nhân viên nào trong danh sách
    if (foundEmployeeIds.length === 0) {
      throw new NotFoundException(`Không tìm thấy nhân viên nào để xóa.`);
    }

    // Thực hiện xóa mềm bằng cách đặt giá trị cho deletedAt
    await this.employeeRepository.softRemove(employees);

    console.log(
      `Employees with IDs: ${foundEmployeeIds} have been soft deleted.`,
    );

    // Trả về số lượng nhân viên đã bị xóa và số lượng nhân viên không tìm thấy
    return {
      deletedEmployeeCount: foundEmployeeIds.length,
      notFoundEmployeeCount: notFoundEmployeeIds.length,
    };
  }
}
