import { Controller, Get, Post, Body, Param, Delete, Inject, OnModuleInit, UseGuards, ParseIntPipe, HttpStatus, Put } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from '@shared/dto/organization/create-organization.dto';
import { UpdateOrganizationDto } from '@shared/dto/organization/update-organization.dto';
import { ClientKafka } from '@nestjs/microservices';
import { GetUser } from 'src/decorator/getUser.decorator';
import { User } from '@shared/entities/user.entity';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';

@Controller('organization')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationController implements OnModuleInit {
  constructor(private readonly organizationService: OrganizationService, @Inject('COMPANY_SERVICE') private readonly companyClient: ClientKafka) { }

  onModuleInit() {
    this.companyClient.subscribeToResponseOf('add-organization');
    this.companyClient.subscribeToResponseOf('find-all-organization');
    this.companyClient.subscribeToResponseOf('find-one-organization');
    this.companyClient.subscribeToResponseOf('delete-organization');
    this.companyClient.subscribeToResponseOf('update-organization');
  }


  @Post()
  async create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return await this.organizationService.create(createOrganizationDto);
  }

  @Get()
  async findAll() {
    return await this.organizationService.findAll();
  }

  @Get(':id')
  async findOne(@Param(
    'id',
    new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
  )
  id: number,) {
    return await this.organizationService.findOne(id);
  }

  @Put(':id')
  async update(@Param(
    'id',
    new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
  )
  id: number, @Body() updateOrganizationDto: UpdateOrganizationDto) {
    return await this.organizationService.update(+id, updateOrganizationDto);
  }

  @Delete(':id')
  async remove(@Param(
    'id',
    new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
  )
  id: number) {
    return await this.organizationService.remove(+id);
  }
}
