import { Controller, Get, Post, Body, Param, Delete, Inject, OnModuleInit, ParseIntPipe, HttpStatus, Put, UseGuards, ParseArrayPipe, Query } from '@nestjs/common';
import { PositionService } from './position.service';
import { ClientKafka } from '@nestjs/microservices';
import { CreatePositionDto } from '@shared/dto/position/create-position.dto';
import { UpdatePositionDto } from '@shared/dto/position/update-position.dto';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { Roles } from 'src/decorator/roles.decorator';
import { GetUser } from 'src/decorator/getUser.decorator';
import { User } from '@shared/entities/user.entity';

@Controller('position')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(1)
export class PositionController implements OnModuleInit {
  constructor(private readonly positionService: PositionService, @Inject('COMPANY_SERVICE') private readonly companyClient: ClientKafka) { }

  onModuleInit() {
    this.companyClient.subscribeToResponseOf('add-position');
    this.companyClient.subscribeToResponseOf('filter-position');
    this.companyClient.subscribeToResponseOf('find-one-position');
    this.companyClient.subscribeToResponseOf('remove-position');
    this.companyClient.subscribeToResponseOf('update-position');
    this.companyClient.subscribeToResponseOf('find-by-department-id');
    this.companyClient.subscribeToResponseOf('find-all-position');
  }

  @Post()
  async create(@Body() createPositionDto: CreatePositionDto, @GetUser() user: User) {
    return await this.positionService.create(createPositionDto, user);
  }

  @Get('/all')
  async findAll(@GetUser() user: User) {
    return await this.positionService.findAll(user);
  }

  @Get()
  async filterPosition(@GetUser() user: User,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search: string,
    @Query('branchId') branchId: number,
    @Query('departmentId') departmentId: number,
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('sortDirection') sortDirection: 'ASC' | 'DESC' = 'DESC',
  ) {
    const options = {
      page: page || 1,
      limit: limit || 10,
    }
    const filters = {
      search, branchId, departmentId, sortBy, sortDirection
    }
    return await this.positionService.filterPosition(user, options, filters);
  }

  @Get(':id')
  async findOne(@Param(
    'id',
    new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
  )
  id: number, @GetUser() user: User) {
    return await this.positionService.findOne(id, user);
  }

  @Get('department/:id')
  async findPositionByDepartment(@Param(
    'id',
    new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),

  )
  id: number, @GetUser() user: User) {
    return await this.positionService.findByDepartmentId(id, user);
  }

  @Put(':id')
  async update(@Param(
    'id',
    new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
  )
  id: number, @Body() updatePositionDto: UpdatePositionDto, @GetUser() user: User) {
    return await this.positionService.update(id, updatePositionDto, user);
  }

  @Delete()
  async remove(@Body('ids', new ParseArrayPipe({ items: Number })) ids: number[], @GetUser() user: User) {
    return await this.positionService.remove(ids, user);
  }
}
