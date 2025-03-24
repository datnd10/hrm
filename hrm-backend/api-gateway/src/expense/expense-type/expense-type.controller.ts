import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Inject,
  Param,
  ParseArrayPipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { API_PATH } from '@shared/constants/constants';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/decorator/roles.decorator';
import { ExpenseTypeService } from './expense-type.service';
import { ClientKafka } from '@nestjs/microservices';
import { CreateExpenseTypeDto } from '@shared/dto/expense-type/create-expense-type.dto';
import { GetUser } from 'src/decorator/getUser.decorator';
import { User } from '@shared/entities/user.entity';
import { UpdateExpenseTypeDto } from '@shared/dto/expense-type/update-expense-type.dto';
import { ExpenseTypeCategory } from '@shared/constants/enum';
@Controller(API_PATH.EXPENSETYPE)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(1, 2)
export class ExpenseTypeController {
  constructor(
    private readonly expenseTypeService: ExpenseTypeService,
    @Inject('EXPENSE_SERVICE')
    private readonly expenseTypeClient: ClientKafka,
  ) { }

  onModuleInit() {
    this.expenseTypeClient.subscribeToResponseOf('add-expense-type');
    this.expenseTypeClient.subscribeToResponseOf('filter-expense-type');
    this.expenseTypeClient.subscribeToResponseOf('find-one-expense-type');
    this.expenseTypeClient.subscribeToResponseOf('remove-expense-type');
    this.expenseTypeClient.subscribeToResponseOf('update-expense-type');
    this.expenseTypeClient.subscribeToResponseOf('find-all')
  }

  @Post()
  async create(
    @Body() createExpenseTypeDto: CreateExpenseTypeDto,
    @GetUser() user: User,
  ) {
    return await this.expenseTypeService.create(createExpenseTypeDto, user);
  }

  @Get("/all")
  async findAll(@GetUser() user: User) {
    return await this.expenseTypeService.findAll(user);
  }

  @Get()
  async filterEmployee(
    @GetUser() user: User,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search: string,
    @Query('type') type: ExpenseTypeCategory,
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
      type
    };
    return await this.expenseTypeService.filterExpense(user, options, filters);
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
    return await this.expenseTypeService.findOne(+id, user);
  }

  @Put(':id')
  async update(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Body() updateExpenseTypeDto: UpdateExpenseTypeDto,
    @GetUser() user: User,
  ) {
    return await this.expenseTypeService.update(
      +id,
      updateExpenseTypeDto,
      user,
    );
  }

  @Delete()
  async remove(
    @Body('ids', new ParseArrayPipe({ items: Number })) ids: number[],
    @GetUser() user: User,
  ) {
    return await this.expenseTypeService.remove(ids, user);
  }
}
