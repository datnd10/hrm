import {
  BadRequestException,
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
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { ClientKafka } from '@nestjs/microservices';
import { CreateExpenseDto } from '@shared/dto/expense/create-expense.dto';
import { User } from '@shared/entities/user.entity';
import { GetUser } from 'src/decorator/getUser.decorator';
import { UpdateExpenseDto } from '@shared/dto/expense/update-expense.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/decorator/roles.decorator';
import { UpdateStatusDto } from '@shared/dto/expense/update-status.dto'
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetTemplateDto } from '@shared/dto/expense/get-template.dto';
import { ExpenseCategory } from '@shared/constants/enum';

@Controller('expense')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(1, 2)
export class ExpenseController {
  constructor(
    private readonly expenseService: ExpenseService,
    @Inject('EXPENSE_SERVICE')
    private readonly expenseClient: ClientKafka,
  ) { }

  onModuleInit() {
    this.expenseClient.subscribeToResponseOf('add-expense');
    this.expenseClient.subscribeToResponseOf('filter-expense');
    this.expenseClient.subscribeToResponseOf('find-one-expense');
    this.expenseClient.subscribeToResponseOf('remove-expense');
    this.expenseClient.subscribeToResponseOf('update-expense');
    this.expenseClient.subscribeToResponseOf('find-all-expense');
    this.expenseClient.subscribeToResponseOf('update-status-expense');
    this.expenseClient.subscribeToResponseOf('get-template-expense');
    this.expenseClient.subscribeToResponseOf('import-salary');
    this.expenseClient.subscribeToResponseOf('export-salary');
    this.expenseClient.subscribeToResponseOf('import-expense');
    this.expenseClient.subscribeToResponseOf('export-expense');
  }

  @Post('import/type/:type')
  @UseInterceptors(FileInterceptor('file'))
  async importData(@UploadedFile() file: Express.Multer.File,
    @Param('type') type: ExpenseCategory, @GetUser() user: User) {
    const validTypes = Object.values(ExpenseCategory);
    if (!validTypes.includes(type)) {
      throw new BadRequestException(`Type không hợp lệ. Các giá trị hợp lệ là: ${validTypes.join(', ')}`);
    }

    if (!file) {
      throw new BadRequestException('File là bắt buộc');
    }
    // Kiểm tra định dạng file
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('File không đúng định dang. Hãy upload file excel.');
    }

    return await this.expenseService.importData(file, type, user);
  }

  @Post('get-template')
  async getTemplate(
    @Res() res: Response,
    @GetUser() user: User,
    @Body() getTemplateDto: GetTemplateDto,
  ) {
    const { branch, type, billingCycle } = getTemplateDto;

    if (branch.toLowerCase() !== 'all' && isNaN(Number(branch))) {
      throw new BadRequestException('Branch không hợp lệ');
    }

    // Chuyển branchId thành số nếu nó không phải là 'all'
    const branchValue = branch.toLowerCase() === 'all' ? 'all' : parseInt(branch, 10);
    const { buffer, filename } = await this.expenseService.getTemplate(user, branchValue, type, billingCycle);


    // // Convert base64 to buffer
    const fileBuffer = Buffer.from(buffer, 'base64');

    // Set headers for file download
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=${filename}`,
    });

    res.end(Buffer.from(buffer, 'base64'));
  }

  @Get('export-salary')
  async exportSalary(
    @Res() res: Response,
    @GetUser() user: User,
  ) {
    const { buffer, filename } = await this.expenseService.exportSalary(user);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=${filename}`,
    });

    res.end(Buffer.from(buffer, 'base64'));
  }

  @Get('export-expense')
  async exportExpense(
    @Res() res: Response,
    @GetUser() user: User,
  ) {
    const { buffer, filename } = await this.expenseService.exportExpense(user);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=${filename}`,
    });

    res.end(Buffer.from(buffer, 'base64'));
  }


  @Post()
  async create(@Body() createExpense: CreateExpenseDto, @GetUser() user: User) {
    return await this.expenseService.create(createExpense, user);
  }

  @Get('all')
  async findAll(@GetUser() user: User) {
    return await this.expenseService.findAll(user);
  }

  // filter expense type
  @Get()
  async filterEmployee(
    @GetUser() user: User,
    @Query('type') type: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search: string,
    @Query("branchId") branchId: number,
    @Query('status') status: string,
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('sortDirection') sortDirection: 'ASC' | 'DESC' = 'DESC',
    @Query('employeeId') employeeId: number,
    @Query('billingCycle') billingCycle: string,
  ) {
    const options = {
      page: page || 1,
      limit: limit || 10,
    };
    const filters = {
      type,
      search,
      sortBy,
      sortDirection,
      branchId,
      status,
      employeeId,
      billingCycle
    };
    console.log(filters);

    return await this.expenseService.filterExpense(user, options, filters);
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
    return await this.expenseService.findOne(+id, user);
  }

  @Put(':id')
  async update(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Body() updateExpenseItemTypeDto: UpdateExpenseDto,
    @GetUser() user: User,
  ) {
    console.log(updateExpenseItemTypeDto);

    return await this.expenseService.update(
      +id,
      updateExpenseItemTypeDto,
      user,
    );
  }

  @Post('/update-status')
  async updateStatus(
    @Body() updateStatusDto: UpdateStatusDto,
    @GetUser() user: User,
  ) {
    return await this.expenseService.updateStatus(updateStatusDto, user);
  }


  @Delete()
  async remove(
    @Body('ids', new ParseArrayPipe({ items: Number })) ids: number[],
    @GetUser() user: User,
  ) {
    return await this.expenseService.remove(ids, user);
  }
}


