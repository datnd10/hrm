import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Inject, Query, ParseIntPipe, HttpStatus, Put, ParseArrayPipe } from '@nestjs/common';
import { ContractService } from './contract.service';
import { CreateContractDto } from '@shared/dto/contract/create-contract.dto';
import { UpdateContractDto } from '@shared/dto/contract/update-contract.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/decorator/roles.decorator';
import { ClientKafka } from '@nestjs/microservices';
import { GetUser } from 'src/decorator/getUser.decorator';
import { User } from '@shared/entities/user.entity';
import { ContractStatus } from '@shared/constants/enum';

@Controller('contract')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(1, 2)
export class ContractController {
  constructor(private readonly contractService: ContractService,
    @Inject('EMPLOYEE_SERVICE') private readonly employeeClient: ClientKafka,
  ) { }

  onModuleInit() {
    this.employeeClient.subscribeToResponseOf(`add-contract`);
    this.employeeClient.subscribeToResponseOf(`filter-contract`);
    this.employeeClient.subscribeToResponseOf(`find-one-contract`);
    this.employeeClient.subscribeToResponseOf(`remove-contract`);
    this.employeeClient.subscribeToResponseOf(`update-contract`);
    this.employeeClient.subscribeToResponseOf(`find-all-contract`);
    this.employeeClient.subscribeToResponseOf(`find-by-employee-contract`);
  }

  @Post()
  async create(
    @Body() createEmployeeDto: CreateContractDto,
    @GetUser() user: User,
  ) {
    return await this.contractService.create(createEmployeeDto, user);
  }

  @Get('/all')
  async findAll(@GetUser() user: User) {
    return await this.contractService.findAll(user);
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
    @Query('status') status: ContractStatus,
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
      status,
      sortBy,
      sortDirection,
    };
    return await this.contractService.filterContract(user, options, filters);
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
    return await this.contractService.findOne(+id, user);
  }

  @Get('/employee/:id')
  async findByEmployee(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @GetUser() user: User,
  ) {
    return await this.contractService.findByEmployee(+id, user);
  }

  @Put(':id')
  async update(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Body() UpdateEmployeeDto: UpdateContractDto,
    @GetUser() user: User,
  ) {
    return await this.contractService.update(+id, UpdateEmployeeDto, user);
  }

  @Delete()
  async remove(
    @Body('ids', new ParseArrayPipe({ items: Number })) ids: number[],
    @GetUser() user: User,
  ) {
    return await this.contractService.remove(ids, user);
  }
}
