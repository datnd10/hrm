import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Inject,
  HttpStatus,
  ParseIntPipe,
  ParseArrayPipe,
  Put,
  Query,
} from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from '@shared/dto/employee/create-employee.dto';
import { UpdateEmployeeDto } from '@shared/dto/employee/update-employee.dto';
import { API_PATH } from '@shared/constants/constants';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { ClientKafka } from '@nestjs/microservices';
import { GetUser } from 'src/decorator/getUser.decorator';
import { User } from '@shared/entities/user.entity';
import { Roles } from 'src/decorator/roles.decorator';
@Controller(API_PATH.EMPLOYEE)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(1, 2)
export class EmployeeController {
  constructor(
    private readonly employeeService: EmployeeService,
    @Inject('EMPLOYEE_SERVICE') private readonly employeeClient: ClientKafka,
  ) { }

  onModuleInit() {
    this.employeeClient.subscribeToResponseOf(`add-employee`);
    this.employeeClient.subscribeToResponseOf(`filter-employee`);
    this.employeeClient.subscribeToResponseOf(`find-one-employee`);
    this.employeeClient.subscribeToResponseOf(`remove-employee`);
    this.employeeClient.subscribeToResponseOf(`update-employee`);
    this.employeeClient.subscribeToResponseOf(`find-all-employee`);
    this.employeeClient.subscribeToResponseOf(`get-employee-by-department`);
    this.employeeClient.subscribeToResponseOf(`get-employee-by-branch`);
  }

  @Post()
  async create(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @GetUser() user: User,
  ) {
    return await this.employeeService.create(createEmployeeDto, user);
  }

  @Get('/all')
  async findAll(@GetUser() user: User) {
    return await this.employeeService.findAll(user);
  }

  @Get("/department/:id")
  async getEmployeeByDepartment(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @GetUser() user: User
  ) {
    return await this.employeeService.getEmployeeByDepartment(id, user);
  }

  @Get("/branch/:id")
  async getEmployeeByBranch(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @GetUser() user: User
  ) {
    return await this.employeeService.getEmployeeByBranch(id, user);
  }

  @Get()
  async filterEmployee(
    @GetUser() user: User,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search: string,
    @Query("branchId") branchId: number,
    @Query('departmentId') departmentId: number,
    @Query('positionId') positionId: number,
    @Query('roleId') roleId: number,
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('sortDirection') sortDirection: 'ASC' | 'DESC' = 'DESC',
  ) {
    const options = {
      page: page || 1,
      limit: limit || 10,
    };
    const filters = {
      search,
      branchId,
      departmentId,
      positionId,
      roleId,
      sortBy,
      sortDirection,
    };
    return await this.employeeService.filterEmployee(user, options, filters);
  }

  @Get(':id')
  async findOne(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @GetUser() user: User,
  ) {
    return await this.employeeService.findOne(+id, user);
  }

  @Put(':id')
  async update(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Body() UpdateEmployeeDto: UpdateEmployeeDto,
    @GetUser() user: User,
  ) {
    return await this.employeeService.update(+id, UpdateEmployeeDto, user);
  }

  @Delete()
  async remove(
    @Body('ids', new ParseArrayPipe({ items: Number })) ids: number[],
    @GetUser() user: User,
  ) {
    return await this.employeeService.remove(ids, user);
  }
}
