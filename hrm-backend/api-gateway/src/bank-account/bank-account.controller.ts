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
import { BankAccountService } from './bank-account.service';
import { CreateBankAccountDto } from '@shared/dto/bank-account/create-bank-account.dto';
import { UpdateBankAccountDto } from '@shared/dto/bank-account/update-bank-account.dto';
import { API_PATH } from '@shared/constants/constants';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { ClientKafka } from '@nestjs/microservices';
import { GetUser } from 'src/decorator/getUser.decorator';
import { User } from '@shared/entities/user.entity';
import { Roles } from 'src/decorator/roles.decorator';

@Controller(API_PATH.BankAccount)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(1, 2)
export class BankAccountController {
  constructor(
    private readonly bankAccountService: BankAccountService,
    @Inject('BANK_ACCOUNT_SERVICE')
    private readonly bankAccountClient: ClientKafka,
  ) { }

  onModuleInit() {
    this.bankAccountClient.subscribeToResponseOf(`add-bank-account`);
    this.bankAccountClient.subscribeToResponseOf(`find-all-bank-account`);
    this.bankAccountClient.subscribeToResponseOf(`find-one-bank-account`);
    this.bankAccountClient.subscribeToResponseOf(`remove-bank-account`);
    this.bankAccountClient.subscribeToResponseOf(`update-bank-account`);
    this.bankAccountClient.subscribeToResponseOf('filter-bank-account');
  }

  @Post()
  async create(
    @Body() createBankAccountDto: CreateBankAccountDto,
    @GetUser() user: User,
  ) {
    return await this.bankAccountService.create(createBankAccountDto, user);
  }

  @Get("/all")
  async findAll(@GetUser() user: User) {
    return await this.bankAccountService.findAll(user);
  }

  @Get()
  async filterBranch(
    @GetUser() user: User,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('searchByAccountName') searchByAccountName: string,
    @Query('searchByBankName') searchByBankName: string,
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('sortDirection') sortDirection: 'ASC' | 'DESC' = 'DESC',
  ) {
    const options = {
      page: page || 1, // Gán giá trị mặc định cho page
      limit: limit || 10, // Gán giá trị mặc định cho limit
    };
    const filters = { searchByAccountName, searchByBankName, sortBy, sortDirection };
    return this.bankAccountService.filterBank(user, options, filters);
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
    console.log(id);

    return await this.bankAccountService.findOne(id, user); // Truyền cả user vào
  }

  @Put(':id')
  async update(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Body() updateBankAccountDto: UpdateBankAccountDto,
    @GetUser() user: User,
  ) {
    return await this.bankAccountService.update(id, updateBankAccountDto, user); // Truyền cả user vào
  }

  @Delete()
  async remove(
    @Body('ids', new ParseArrayPipe({ items: Number })) ids: number[],
    @GetUser() user: User,
  ) {
    return await this.bankAccountService.remove(ids, user); // Truyền cả user vào
  }
}
