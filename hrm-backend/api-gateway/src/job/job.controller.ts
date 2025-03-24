import { Controller, Get, Post, Body, Patch, Param, Delete, Inject, ParseIntPipe, HttpStatus, ParseArrayPipe, Put, UseGuards, Query } from '@nestjs/common';
import { JobService } from './job.service';
import { CreateJobDto } from '@shared/dto/job/create-job.dto';
import { UpdateJobDto } from '@shared/dto/job/update-job.dto';
import { ClientKafka } from '@nestjs/microservices';
import { GetUser } from 'src/decorator/getUser.decorator';
import { User } from '@shared/entities/user.entity';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/decorator/roles.decorator';
import { JobStatus } from '@shared/constants/enum';
@Controller('job')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(1, 2)
export class JobController {
  constructor(private readonly jobService: JobService, @Inject('JOB_SERVICE')
  private readonly jobClient: ClientKafka,) { }

  onModuleInit() {
    this.jobClient.subscribeToResponseOf('add-job');
    this.jobClient.subscribeToResponseOf('find-all-job');
    this.jobClient.subscribeToResponseOf('find-one-job');
    this.jobClient.subscribeToResponseOf('remove-job');
    this.jobClient.subscribeToResponseOf('update-job');
    this.jobClient.subscribeToResponseOf('filter-job');
  }

  @Post()
  async create(
    @Body() createJobDto: CreateJobDto,
    @GetUser() user: User,
  ) {
    return await this.jobService.create(createJobDto, user);
  }

  @Get("/all")
  async findAll(@GetUser() user: User) {
    return await this.jobService.findAll(user);
  }

  @Get()
  async filter(
    @GetUser() user: User,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search: string,
    @Query('status') status: JobStatus,
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('sortDirection') sortDirection: 'ASC' | 'DESC' = 'DESC',
  ) {
    const options = {
      page: page || 1,
      limit: limit || 10,
    };
    const filters = {
      search,
      sortBy,
      sortDirection,
      status
    };
    return await this.jobService.filterJob(user, options, filters);
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
    return await this.jobService.findOne(+id, user);
  }

  @Put(':id')
  async update(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Body() updateJobDto: UpdateJobDto,
    @GetUser() user: User,
  ) {
    return await this.jobService.update(
      +id,
      updateJobDto,
      user,
    );
  }

  @Delete()
  async remove(
    @Body('ids', new ParseArrayPipe({ items: Number })) ids: number[],
    @GetUser() user: User,
  ) {
    return await this.jobService.remove(ids, user);
  }
}
