import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { CreateExpenseTypeDto } from '@shared/dto/expense-type/create-expense-type.dto';
import { UpdateExpenseTypeDto } from '@shared/dto/expense-type/update-expense-type.dto';
import { ExpenseType } from '@shared/entities/expense-type.entity';
import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';
import { User } from '@shared/entities/user.entity';
import { ResponseExpenseTypeDto } from '@shared/dto/expense-type/response-expense-type.dto';
import { ExpenseRange } from '@shared/entities/expense-range.entity';
import { ExpenseTypeCategory, FormulaType } from '@shared/constants/enum';

@Injectable()
export class ExpenseTypeService {
  private readonly initialExpenseTypes: CreateExpenseTypeDto[];
  constructor(
    @InjectRepository(ExpenseType)
    private readonly expenseTypeRepository: Repository<ExpenseType>,

    @InjectRepository(ExpenseRange)
    private readonly expenseRangeRepository: Repository<ExpenseRange>,
    private readonly dataSource: DataSource,
  ) {
    this.initialExpenseTypes = [
      {
        name: 'Lương cơ bản',
        description: 'Lương hàng tháng',
        type: ExpenseTypeCategory.SALARY,
        formulaType: FormulaType.BASE_SALARY,
      },
      {
        name: 'Hỗ trợ ăn trưa',
        description: 'Hỗ trợ ăn trưa',
        type: ExpenseTypeCategory.SALARY,
        formulaType: FormulaType.FIXED_COST,
        basePrice: 35000,
      },
      {
        name: 'Hỗ trợ đi lại',
        description: 'Hỗ trợ đi lại dựa trên km',
        type: ExpenseTypeCategory.SALARY,
        formulaType: FormulaType.TIERED_COST,
        expenseRanges: [
          {
            minRange: 0,
            maxRange: 20,
            price: 20000
          },
          {
            minRange: 21,
            maxRange: 40,
            price: 30000
          }
        ]
      },
      {
        name: 'Tiền thưởng',
        description: 'Tiền thưởng',
        type: ExpenseTypeCategory.SALARY,
        formulaType: FormulaType.VARIABLE_COST,
      },
    ];
  }

  async initializeExpenseTypes(user: User): Promise<void> {
    for (const expenseType of this.initialExpenseTypes) {
      await this.create(expenseType, user);
    }
  }

  // Kiểm tra trùng lặp tên loại chi phí
  private async checkForDuplicateExpenseType(
    name: string,
    organizationId: number,
    id?: number,
  ): Promise<boolean> {
    const query = this.expenseTypeRepository
      .createQueryBuilder('expenseType')
      .where('expenseType.name = :name', { name })
      .andWhere('expenseType.organizationId = :organizationId', { organizationId: organizationId })
      .andWhere('expenseType.deletedAt IS NULL');

    if (id) query.andWhere('expenseType.id != :id', { id });
    return !!(await query.getOne());
  }

  async findAll(): Promise<ExpenseType[]> {
    return await this.expenseTypeRepository.find();
  }

  async filterExpenseType(
    user: User,
    options: IPaginationOptions,
    filters: {
      search: string;
      sortBy: string;
      type: ExpenseTypeCategory;
      sortDirection: 'ASC' | 'DESC';
    },
  ): Promise<Pagination<ResponseExpenseTypeDto>> {
    // Tạo query builder cho việc lọc ExpenseTypeF
    const queryBuilder =
      this.expenseTypeRepository.createQueryBuilder('expenseType')
        .where('expenseType.deletedAt IS NULL')
        .andWhere('expenseType.organizationId = :organizationId', { organizationId: user.organization.id })

    // Thêm bộ lọc tìm kiếm nếu có
    if (filters.search) {
      queryBuilder.andWhere('expenseType.name LIKE :search', {
        search: `%${filters.search}%`,
      });
    }

    // Thêm bộ lọc isSalary nếu có
    if (filters.type) {
      queryBuilder.andWhere('expenseType.type = :type', {
        type: filters.type,
      });
    }

    const sortFieldMap = {
      categoryName: 'expenseType.type',
      formulaName: 'expenseType.formulaType',
    };

    const sortField = sortFieldMap[filters.sortBy] || `expenseType.${filters.sortBy || 'name'}`;
    queryBuilder.orderBy(sortField, filters.sortDirection);



    // Thực hiện phân trang và trả về kết quả
    const paginatedResults = await paginate<ExpenseType>(queryBuilder, options);


    // Trả về kết quả phân trang đã format
    return paginatedResults;
  }

  async findOne(id: number): Promise<ExpenseType> {
    const expenseType = await this.expenseTypeRepository.findOne({
      where: { id },
      relations: ['expenseRanges'],
    });

    if (!expenseType) {
      throw new NotFoundException(
        `Loại chi phí với ID ${id} không được tìm thấy.`,
      );
    }

    return expenseType;
  }

  private validateExpenseTypeData(formulaType: FormulaType, basePrice?: number, expenseRanges?: any[]) {
    if (formulaType === FormulaType.FIXED_COST && !basePrice) {
      throw new HttpException(
        { field: 'basePrice', errors: ['Giá tiền là bắt buộc khi sử dụng công thức cố định.'] },
        HttpStatus.BAD_REQUEST,
      );
    }
    if (formulaType === FormulaType.TIERED_COST && (!expenseRanges || expenseRanges.length === 0)) {
      throw new HttpException(
        { field: 'expenseRanges', errors: ['expenseRanges phải chứa ít nhất một phần tử.'] },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async create(createExpenseTypeDto: CreateExpenseTypeDto, user: User): Promise<ExpenseType> {
    return await this.dataSource.transaction(async (manager) => {
      const { name, description, type, formulaType, basePrice, expenseRanges } = createExpenseTypeDto;

      this.validateExpenseTypeData(formulaType, basePrice, expenseRanges);

      if (await this.checkForDuplicateExpenseType(name, user.organization.id)) {
        throw new HttpException(
          { field: 'name', errors: [`Loại chi phí '${name}' đã tồn tại.`] },
          HttpStatus.CONFLICT,
        );
      }

      // Tạo đối tượng `ExpenseType`
      const expenseTypeData = {
        name,
        description,
        type,
        formulaType,
        organization: user.organization,
        ...(formulaType === FormulaType.FIXED_COST && { basePrice }), // Thêm `basePrice` nếu là `FIXED_COST`
      };
      const expenseType = manager.create(ExpenseType, expenseTypeData);
      const savedExpenseType = await manager.save(expenseType);

      // Tạo và lưu `ExpenseRange` nếu có `expenseRanges`
      if (formulaType === FormulaType.TIERED_COST && expenseRanges) {
        const expenseRangeEntities = expenseRanges.map((rangeDto) =>
          manager.create(ExpenseRange, {
            ...rangeDto,
            expenseType: savedExpenseType,
          }),
        );

        // Lưu tất cả `ExpenseRange`
        await manager.save(expenseRangeEntities);
      }

      return savedExpenseType;
    });
  }




  async update(
    id: number,
    updateExpenseTypeDto: UpdateExpenseTypeDto,
  ): Promise<ExpenseType> {
    return await this.dataSource.transaction(async (manager) => {
      console.log(updateExpenseTypeDto);

      const { name, description, type, formulaType, basePrice, expenseRanges } = updateExpenseTypeDto;


      const expenseType = await this.expenseTypeRepository.findOne({
        where: { id },
      });

      if (!expenseType) {
        throw new NotFoundException(`Loại chi phí với ID ${id} không được tìm thấy.`);
      }

      if (name && name !== expenseType.name && (await this.checkForDuplicateExpenseType(name, id))) {
        throw new HttpException(
          { field: 'name', errors: [`Loại chi phí '${name}' đã tồn tại.`] },
          HttpStatus.CONFLICT,
        );
      }

      this.validateExpenseTypeData(formulaType, basePrice, expenseRanges);

      // Cập nhật các trường của `ExpenseType`
      expenseType.name = name || expenseType.name;
      expenseType.description = description || expenseType.description;
      expenseType.type = type !== undefined ? type : expenseType.type;
      expenseType.formulaType = formulaType || expenseType.formulaType;
      expenseType.basePrice = formulaType === FormulaType.FIXED_COST ? basePrice : null;

      if (expenseType.formulaType === FormulaType.TIERED_COST && formulaType !== FormulaType.TIERED_COST) {
        // Xóa tất cả các `expenseRanges` liên quan
        await manager.delete(ExpenseRange, { expenseType: expenseType });
      }

      // Xóa `expenseRanges` cũ nếu công thức thay đổi sang `TIERED_COST`
      if (formulaType === FormulaType.TIERED_COST) {
        await manager.delete(ExpenseRange, { expenseType: expenseType });

        const expenseRangeEntities = expenseRanges.map((rangeDto) =>
          manager.create(ExpenseRange, {
            ...rangeDto,
            expenseType: expenseType,
          }),
        );

        // Lưu mới các `ExpenseRange`
        await manager.save(expenseRangeEntities);
      }

      // Lưu cập nhật vào cơ sở dữ liệu
      return await manager.save(expenseType);
    });
  }


  async remove(ids: number[]): Promise<{ deletedExpenseCount: number; notFoundExpenseCount: number }> {
    // Tìm tất cả `ExpenseType` cùng các `ExpenseRange` liên quan
    const expenseTypes = await this.expenseTypeRepository.find({
      where: { id: In(ids) },
      relations: ['expenseRanges'],
    });

    // Tìm các ID hợp lệ và không hợp lệ
    const foundExpenseTypeIds = expenseTypes.map((exp) => exp.id);
    const notFoundExpenseTypeIds = ids.filter((id) => !foundExpenseTypeIds.includes(id));

    // Nếu không tìm thấy bản ghi nào trong danh sách ID, trả về ngay
    if (!foundExpenseTypeIds.length) {
      return { deletedExpenseCount: 0, notFoundExpenseCount: ids.length };
    }

    // Lọc ra các `ExpenseType` có công thức là `TIERED_COST`
    const tieredCostExpenseTypes = expenseTypes.filter(
      (exp) => exp.formulaType === FormulaType.TIERED_COST,
    );

    // Xóa mềm tất cả `ExpenseRange` liên quan nếu `ExpenseType` có `formulaType` là `TIERED_COST`
    const expenseRangesToDelete = tieredCostExpenseTypes.flatMap((exp) => exp.expenseRanges || []);
    if (expenseRangesToDelete.length) {
      await this.expenseRangeRepository.softRemove(expenseRangesToDelete);
    }

    // Xóa mềm các `ExpenseType`
    await this.expenseTypeRepository.softRemove(expenseTypes);

    return {
      deletedExpenseCount: foundExpenseTypeIds.length,
      notFoundExpenseCount: notFoundExpenseTypeIds.length,
    };
  }
}
