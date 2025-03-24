import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateEmployeeDto } from '@shared/dto/employee/create-employee.dto';
import { UpdateEmployeeDto } from '@shared/dto/employee/update-employee.dto';
import { Employee } from '@shared/entities/employee.entity';
import { User } from '@shared/entities/user.entity';
import { sendMessageKafka } from 'src/common/kafka.helper';
@Injectable()
export class EmployeeService {
  constructor(
    @Inject('EMPLOYEE_SERVICE') private readonly employeeClient: ClientProxy,
  ) { }
  async create(
    createEmployeeDto: CreateEmployeeDto,
    user: User,
  ): Promise<Employee> {
    const payload = {
      createEmployeeDto,
      user,
    };
    return sendMessageKafka<Employee>(
      this.employeeClient,
      'add-employee',
      JSON.stringify(payload),
    );
  }

  async findAll(user: User): Promise<Employee[]> {
    return sendMessageKafka<Employee[]>(
      this.employeeClient,
      'find-all-employee',
      { user },
    );
  }

  async getEmployeeByDepartment(
    departmentId: number,
    user: User,
  ): Promise<Employee[]> {
    return sendMessageKafka<Employee[]>(
      this.employeeClient,
      'get-employee-by-department',
      { departmentId, user },
    );
  }

  async getEmployeeByBranch(
    branchId: number,
    user: User,
  ): Promise<Employee[]> {
    return sendMessageKafka<Employee[]>(
      this.employeeClient,
      'get-employee-by-branch',
      { branchId, user },
    );
  }

  async filterEmployee(
    user: User,
    options: { page: number; limit: number },
    filters: {
      search: string;
      branchId: number;
      departmentId: number;
      positionId: number;
      roleId: number;
      sortBy: string;
      sortDirection: 'ASC' | 'DESC';
    },
  ): Promise<Employee[]> {
    const message = { user, filters, options };
    return sendMessageKafka<Employee[]>(
      this.employeeClient,
      'filter-employee',
      JSON.stringify(message),
    );
  }

  async findOne(id: number, user: User): Promise<Employee> {
    return sendMessageKafka<Employee>(
      this.employeeClient,
      'find-one-employee',
      { id, user },
    );
  }

  async update(
    id: number,
    updateEmployeeDto: UpdateEmployeeDto,
    user: User,
  ): Promise<Employee> {
    return sendMessageKafka<Employee>(this.employeeClient, 'update-employee', {
      id,
      updateEmployeeDto,
      user,
    });
  }

  async remove(id: number[], user: User): Promise<void> {
    return sendMessageKafka<void>(this.employeeClient, 'remove-employee', {
      id,
      user,
    });
  }
}
