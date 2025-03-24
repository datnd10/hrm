import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ContractStatus } from '@shared/constants/enum';
import { CreateContractDto } from '@shared/dto/contract/create-contract.dto';
import { UpdateContractDto } from '@shared/dto/contract/update-contract.dto';
import { Contract } from '@shared/entities/contract.entity';
import { Employee } from '@shared/entities/employee.entity';
import { User } from '@shared/entities/user.entity';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { Not, Repository } from 'typeorm';
import { ResponseContractDTO } from '@shared/dto/contract/response-contract.dto';
@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,

    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,

  ) { }
  async create(createContractDto: CreateContractDto, user: User) {
    const { contractName, startDate, salary, employeeId, endDate, description } = createContractDto;
    const employee = await this.employeeRepository.findOne({ where: { id: employeeId } });


    const checkContract = await this.contractRepository.findOne({
      where: {
        employee: {
          id: employeeId
        }
      },
    });

    if (!employee) {
      throw new HttpException('Không tìm thấy nhân viên', HttpStatus.NOT_FOUND);
    }


    if (checkContract) {
      throw new HttpException('Nhân viên này đã có hợp đồng.', HttpStatus.BAD_REQUEST);
    }

    const contract = this.contractRepository.create({
      contractName,
      startDate,
      salary,
      employee,
      endDate,
      description
    })

    return await this.contractRepository.save(contract);
  }

  async findAll(user: User): Promise<Contract[]> {
    const contracts = await this.contractRepository
      .createQueryBuilder('contract')
      .innerJoinAndSelect('contract.employee', 'employee')
      .innerJoinAndSelect('employee.department', 'department')
      .innerJoinAndSelect('employee.position', 'position')
      .innerJoinAndSelect('department.branch', 'branch')
      .innerJoinAndSelect('branch.organization', 'organization')
      .where('organization.id = :organizationId', {
        organizationId: user.organization.id,
      })
      .getMany();
    return contracts;
  }

  async findOne(id: number, user: User): Promise<ResponseContractDTO> {
    const contract = await this.contractRepository
      .createQueryBuilder('contract')
      .innerJoin('contract.employee', 'employee')
      .innerJoin('employee.department', 'department')
      .innerJoin('employee.position', 'position')
      .innerJoin('department.branch', 'branch')
      .innerJoin('branch.organization', 'organization')
      .where('contract.id = :id', { id })
      .andWhere('branch.organizationId = :organizationId', {
        organizationId: user.organization.id,
      })
      .select([
        'contract.id',
        'contract.contractName',
        'contract.startDate',
        'contract.endDate',
        'contract.salary',
        'contract.description',
        'contract.status',
        'employee.id',
        'employee.fullName',
        'department.id',
        'department.departmentName',
        'branch.id',
        'branch.branchName',
        'position.id',
        'position.positionName',
      ])
      .getRawOne();

    if (!contract) {
      throw new NotFoundException(
        `Hợp đồng không được tìm thấy trong hệ thống.`,
      );
    }

    return {
      id: contract.contract_id,
      contractName: contract.contract_contractName,
      startDate: contract.contract_startDate,
      endDate: contract.contract_endDate,
      salary: contract.contract_salary,
      description: contract.contract_description,
      status: contract.contract_status,
      employee: {
        id: contract.employee_id,
        fullName: contract.employee_fullName,
      },
      branch: {
        id: contract.branch_id,
        branchName: contract.branch_branchName,
      },
      department: {
        id: contract.department_id,
        departmentName: contract.department_departmentName,
      },
      position: {
        id: contract.position_id,
        positionName: contract.position_positionName,
      },
    };
  }

  async findOneByEmployee(id: number, user: User): Promise<any> {
    const contract = await this.contractRepository
      .createQueryBuilder('contract')
      .innerJoin('contract.employee', 'employee')
      .innerJoin('employee.department', 'department')
      .innerJoin('department.branch', 'branch')
      .innerJoin('branch.organization', 'organization')
      .where('employee.id = :id', { id })
      .andWhere('branch.organizationId = :organizationId', {
        organizationId: user.organization.id,
      })
      .select([
        'contract.id',
        'contract.contractName',
        'contract.startDate',
        'contract.endDate',
        'contract.salary',
        'contract.description',
        'contract.status',
        'employee.id',
        'employee.fullName',
      ])
      .getRawOne();

    if (!contract) {
      throw new NotFoundException(
        `Hợp đồng không được tìm thấy trong hệ thống.`,
      );
    }

    return {
      id: contract.contract_id,
      contractName: contract.contract_contractName,
      startDate: contract.contract_startDate,
      endDate: contract.contract_endDate,
      salary: contract.contract_salary,
      description: contract.contract_description,
      status: contract.contract_status,
      employee: {
        id: contract.employee_id,
        fullName: contract.employee_fullName,
      },
    };
  }

  async update(id: number, updateContractDto: UpdateContractDto, user: User): Promise<Contract> {
    const { contractName, startDate, endDate, salary, description, status, employeeId } = updateContractDto;

    // Find the contract by ID and ensure it belongs to the user's organization
    const contract = await this.contractRepository
      .createQueryBuilder('contract')
      .innerJoinAndSelect('contract.employee', 'employee')
      .innerJoinAndSelect('employee.department', 'department')
      .innerJoinAndSelect('department.branch', 'branch')
      .innerJoinAndSelect('branch.organization', 'organization')
      .where('contract.id = :id', { id })
      .andWhere('branch.organizationId = :organizationId', {
        organizationId: user.organization.id,
      })
      .getOne();

    if (!contract) {
      throw new NotFoundException(`Hợp đồng không được tìm thấy trong hệ thống.`);
    }

    // If an employee ID is provided, check if the employee exists
    if (employeeId) {
      const employee = await this.employeeRepository.findOne({ where: { id: employeeId } });
      if (!employee) {
        throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);
      }
      contract.employee = employee;
    }

    const checkContract = await this.contractRepository.findOne({
      where: {
        id: Not(id),
        employee: {
          id: employeeId
        }
      },
    });

    if (checkContract) {
      throw new HttpException('Nhân viên này đã có hợp đồng.', HttpStatus.CONFLICT);
    }

    // Update contract properties
    contract.contractName = contractName ?? contract.contractName;
    contract.startDate = startDate ?? contract.startDate;
    contract.endDate = endDate ?? contract.endDate;
    contract.salary = salary ?? contract.salary;
    contract.description = description ?? contract.description;
    contract.status = status ?? contract.status;

    // Save the updated contract to the database
    return await this.contractRepository.save(contract);
  }

  async filterContract(
    user: User,
    options: IPaginationOptions,
    filters: {
      search: string;
      branchId?: number;
      departmentId?: number;
      positionId?: number;
      status?: ContractStatus;
      sortBy: string;
      sortDirection: 'ASC' | 'DESC';
    },
  ): Promise<Pagination<ResponseContractDTO>> {
    // Tạo query builder
    const queryBuilder = await this.contractRepository
      .createQueryBuilder('contract')
      .innerJoin('contract.employee', 'employee')
      .innerJoin('employee.department', 'department')
      .innerJoin('employee.position', 'position')
      .innerJoin('department.branch', 'branch')
      .where('branch.organization.id = :organizationId', {
        organizationId: user.organization.id,
      })
      .select([
        'contract.id',
        'contract.contractName',
        'contract.startDate',
        'contract.endDate',
        'contract.salary',
        'contract.description',
        'contract.status',
        'employee.id',
        'employee.fullName',
        'branch.id',
        'branch.branchName',
        'department.id',
        'department.departmentName',
        'position.id',
        'position.positionName',
      ])
      .cache(true, 60000);
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

    if (filters.status) {
      queryBuilder.andWhere('contract.status = :status', {
        status: filters.status,
      });
    }

    if (filters.search) {
      queryBuilder.andWhere('employee.fullName LIKE :search', {
        search: `%${filters.search}%`,
      });
    }

    console.log(filters);


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
      case 'fullName':
        queryBuilder.orderBy('employee.fullName', filters.sortDirection);
        break;
      default:
        queryBuilder.orderBy(
          `contract.${filters.sortBy}`,
          filters.sortDirection,
        );
        break;
    }

    // Thực hiện phân trang và trả về kết quả
    const paginatedResults = await paginate<Contract>(queryBuilder, options);

    const formattedResults = paginatedResults.items.map((contract) => {
      return {
        id: contract.id,
        contractName: contract.contractName,
        startDate: contract.startDate,
        endDate: contract.endDate,
        salary: contract.salary,
        description: contract.description,
        status: contract.status,
        employee: {
          id: contract.employee.id,
          fullName: contract.employee.fullName,
        },
        branch: {
          id: contract.employee.department.branch.id,
          branchName: contract.employee.department.branch.branchName,
        },
        department: {
          id: contract.employee.department.id,
          departmentName: contract.employee.department.departmentName,
        },
        position: {
          id: contract.employee.position.id,
          positionName: contract.employee.position.positionName,
        },
      };
    });


    return {
      ...paginatedResults,
      items: formattedResults,
    };
  }


  async remove(
    ids: number[],
    user: User,
  ): Promise<{ deletedContractCount: number; notFoundContractCount: number }> {
    // Tìm các hợp đồng theo danh sách ID và lọc theo organizationId
    const contracts = await this.contractRepository
      .createQueryBuilder('contract')
      .innerJoinAndSelect('contract.employee', 'employee')
      .innerJoinAndSelect('employee.department', 'department')
      .innerJoinAndSelect('department.branch', 'branch')
      .innerJoinAndSelect('branch.organization', 'organization')
      .where('contract.id IN (:...ids)', { ids })
      .andWhere('organization.id = :organizationId', {
        organizationId: user.organization.id,
      })
      .getMany();

    // Lấy các ID của hợp đồng đã tìm thấy
    const foundContractIds = contracts.map((contract) => contract.id);

    // Lọc ra các ID không tìm thấy
    const notFoundContractIds = ids.filter(
      (id) => !foundContractIds.includes(id),
    );

    // Nếu không tìm thấy bất kỳ hợp đồng nào trong danh sách
    if (foundContractIds.length === 0) {
      throw new NotFoundException(`Không tìm thấy hợp đồng nào để xóa.`);
    }

    // Thực hiện xóa mềm bằng cách đặt giá trị cho deletedAt
    await this.contractRepository.softRemove(contracts);

    console.log(
      `Contracts with IDs: ${foundContractIds} have been soft deleted.`,
    );

    // Trả về số lượng hợp đồng đã bị xóa và số lượng hợp đồng không tìm thấy
    return {
      deletedContractCount: foundContractIds.length,
      notFoundContractCount: notFoundContractIds.length,
    };
  }
}
