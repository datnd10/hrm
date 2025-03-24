import { Controller, Get, Post, Body, Param, Delete, Inject, ParseIntPipe, HttpStatus, Put, OnModuleInit, UseGuards, ParseArrayPipe, Query } from '@nestjs/common';
import { BranchService } from './branch.service';
import { ClientKafka } from '@nestjs/microservices';
import { CreateBranchDto } from '@shared/dto/branch/create-branch.dto';
import { UpdateBranchDto } from '@shared/dto/branch/update-branch.dto';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { Roles } from 'src/decorator/roles.decorator';
import { COMPANY_TOPIC, API_PATH } from '@shared/constants/constants'
import { GetUser } from 'src/decorator/getUser.decorator';
import { User } from '@shared/entities/user.entity';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Branch } from '@shared/entities/branch.entity';
@Controller(API_PATH.BRANCH)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(1)
export class BranchController implements OnModuleInit {
  constructor(private readonly branchService: BranchService, @Inject('COMPANY_SERVICE') private readonly companyClient: ClientKafka) { }
  onModuleInit() {
    this.companyClient.subscribeToResponseOf('add-branch');
    this.companyClient.subscribeToResponseOf('find-all-branch');
    this.companyClient.subscribeToResponseOf('find-one-branch');
    this.companyClient.subscribeToResponseOf('delete-branch');
    this.companyClient.subscribeToResponseOf('update-branch');
    this.companyClient.subscribeToResponseOf('filter-branch');
  }

  @Post('')
  async addBranch(@Body() createBranchDto: CreateBranchDto, @GetUser() user: User) {
    return await this.branchService.addBranch(createBranchDto, user);  // Trả về kết quả nhận được từ branchService
  }

  @Get('/all')
  async findAll(@GetUser() user: User) {
    return await this.branchService.findAll(user);
  }

  @Get()
  async filterBranch(
    @GetUser() user: User,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search: string,
    @Query('isActive') isActive: boolean,
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('sortDirection') sortDirection: 'ASC' | 'DESC' = 'DESC',
  ) {
    const options = {
      page: page || 1, // Gán giá trị mặc định cho page
      limit: limit || 10, // Gán giá trị mặc định cho limit
    };
    const filters = { search, isActive, sortBy, sortDirection };
    return this.branchService.filterBranch(user, options, filters);
  }


  @Get('/:id')
  async findOneBranch(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @GetUser() user: User
  ) {
    return await this.branchService.findOne(id, user);
  }

  @Put(':id')
  async updateCompany(@Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) id: number, @Body() updateBranchDto: UpdateBranchDto, @GetUser() user: User) {
    return await this.branchService.updateBranch(updateBranchDto, id, user);
  }

  @Delete()
  async deleteCompany(@Body('ids', new ParseArrayPipe({ items: Number })) ids: number[], @GetUser() user: User) {
    return await this.branchService.deleteBranch(ids, user);
  }
}
