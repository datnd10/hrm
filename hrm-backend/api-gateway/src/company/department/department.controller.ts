import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Inject,
  OnModuleInit,
  Put,
  ParseIntPipe,
  HttpStatus,
  UseGuards,
  ParseArrayPipe,
} from '@nestjs/common';
import { DepartmentService } from './department.service';
import { ClientKafka } from '@nestjs/microservices';
import { CreateDepartmentDto } from '@shared/dto/department/create-department.dto';
import { UpdateDepartmentDto } from '@shared/dto/department/update-department.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { Roles } from 'src/decorator/roles.decorator';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { API_PATH } from '@shared/constants/constants';
import { User } from '@shared/entities/user.entity';
import { GetUser } from 'src/decorator/getUser.decorator';

@Controller(API_PATH.DEPARTMENT)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(1, 2)
export class DepartmentController implements OnModuleInit {
  constructor(
    private readonly departmentService: DepartmentService,
    @Inject('COMPANY_SERVICE') private readonly companyClient: ClientKafka,
  ) { }

  onModuleInit() {
    this.companyClient.subscribeToResponseOf('add-department');
    this.companyClient.subscribeToResponseOf('find-all-department');
    this.companyClient.subscribeToResponseOf('find-one-department');
    this.companyClient.subscribeToResponseOf('remove-department');
    this.companyClient.subscribeToResponseOf('update-department');
    this.companyClient.subscribeToResponseOf('find-department-by-branch');
  }

  @Post()
  async create(
    @Body() createDepartmentDto: CreateDepartmentDto,
    @GetUser() user: User,
  ) {
    return await this.departmentService.create(createDepartmentDto, user);
  }

  @Get()
  async findAll(@GetUser() user: User) {
    return await this.departmentService.findAll(user);
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
    return await this.departmentService.findOne(+id, user);
  }

  @Get('branch/:id')
  async findDepartmentByBranch(@Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) id: number) {
    return await this.departmentService.findDepartmentByBranch(id);
  }

  @Put(':id')
  async update(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
    @GetUser() user: User,
  ) {
    console.log(updateDepartmentDto);

    return await this.departmentService.update(+id, updateDepartmentDto, user);
  }

  @Delete()
  async remove(
    @Body('ids', new ParseArrayPipe({ items: Number })) ids: number[],
    @GetUser() user: User,
  ) {
    return await this.departmentService.remove(ids, user);
  }
}
