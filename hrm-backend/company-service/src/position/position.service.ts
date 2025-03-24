import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePositionDto } from '@shared/dto/position/create-position.dto';
import { UpdatePositionDto } from '@shared/dto/position/update-position.dto';
import { Department } from '@shared/entities/department.entity';
import { Position } from '@shared/entities/position.entity';
import { User } from '@shared/entities/user.entity';
import { RelationFormatterService } from '@shared/util/relation-formatter.service';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { DeleteResult, In, Not, Repository } from 'typeorm';
import { PositionResponseDto } from '@shared/dto/position/position-response.dto'
@Injectable()
export class PositionService {
  constructor(
    @InjectRepository(Department) private departmentRepo: Repository<Department>,

    @InjectRepository(Position) private positionRepo: Repository<Position>
  ) { }
  async create(createDto: CreatePositionDto, user: User): Promise<Position> {
    const { departmentId, positionName } = createDto;

    // 1. Tìm Department và kiểm tra xem nó có tồn tại không, đồng thời lấy branch
    const department = await this.departmentRepo.findOne({
      where: { id: departmentId },
      relations: ['branch', 'branch.organization'],  // Lấy thông tin branch để kiểm tra
    });

    if (!department) {
      throw new NotFoundException({ field: 'departmentId', errors: ['Phòng ban không được tìm thấy.'] });
    }

    // 2. Kiểm tra xem branch của department có thuộc tổ chức của người dùng không
    const branch = department.branch;

    if (branch.organization.id !== user.organization.id) {
      throw new UnauthorizedException({ field: 'departmentId', errors: [`Phòng ban không được tìm thấy trong tổ chức.`] });
    }

    // 3. Kiểm tra trùng tên position trong cùng department
    const existingPositionInDepartment = await this.positionRepo.findOne({
      where: { positionName, department: { id: departmentId } },
    });

    if (existingPositionInDepartment) {
      throw new ConflictException(
        {
          field: 'positionName',
          errors: [`Phòng ban với tên là '${positionName}' đã tồn tại trong phòng ban '${department.departmentName}'.`]
        }
      );
    }

    // 4. Tạo mới Position
    const position = this.positionRepo.create({
      positionName,
      department,  // Gán department đã kiểm tra
    });

    return await this.positionRepo.save(position);
  }

  async filterPosition(
    user: User,
    paginationOptions: IPaginationOptions,
    filters: {
      search: string;
      branchId?: number;
      departmentId?: number;
      sortBy: string;
      sortDirection: 'ASC' | 'DESC';
    }
  ): Promise<Pagination<PositionResponseDto>> {
    const queryBuilder = this.positionRepo.createQueryBuilder('position')
      .select([
        'position.id',
        'position.positionName',
        'position.isActive',
        'department.id',
        'department.departmentName',
        'branch.id',
        'branch.branchName',
      ])
      .innerJoin('position.department', 'department')
      .innerJoin('department.branch', 'branch')
      .innerJoin('branch.organization', 'organization')
      .where('organization.id = :organizationId', { organizationId: user.organization.id });

    // Apply branch filter if provided
    if (filters.branchId) {
      queryBuilder.andWhere('branch.id = :branchId', { branchId: filters.branchId });
    }

    // Apply department filter if provided
    if (filters.departmentId) {
      queryBuilder.andWhere('department.id = :departmentId', { departmentId: filters.departmentId });
    }

    // Apply search filter if provided
    if (filters.search) {
      queryBuilder.andWhere('position.positionName LIKE :search', { search: `%${filters.search}%` });
    }

    // Apply sorting
    const sortableColumns = {
      departmentName: 'department.departmentName',
      branchName: 'branch.branchName',
      positionName: 'position.positionName',
      isActive: 'position.isActive',
    };

    const sortColumn = sortableColumns[filters.sortBy] || 'position.createdAt';
    queryBuilder.orderBy(sortColumn, filters.sortDirection);

    // Pagination
    const paginatedResults = await paginate<Position>(queryBuilder, paginationOptions);

    // Format results
    const formattedResults = paginatedResults.items.map((position) => ({
      id: position.id,
      positionName: position.positionName,
      isActive: position.isActive,
      department: {
        id: position.department.id,
        departmentName: position.department.departmentName,
      },
      branch: {
        id: position.department.branch.id,
        branchName: position.department.branch.branchName,
      },
    }));

    // Return formatted results
    return {
      ...paginatedResults,
      items: formattedResults,
    };
  }


  async findAll(user: User): Promise<Position[]> {
    const data = await this.positionRepo.createQueryBuilder('position')
      .innerJoinAndSelect('position.department', 'department')   // Lấy thông tin department
      .innerJoinAndSelect('department.branch', 'branch')         // Lấy thông tin branch
      .innerJoinAndSelect('branch.organization', 'organization') // Lấy thông tin organization
      .where('organization.id = :organizationId', { organizationId: user.organization.id })  // Chỉ lấy những position thuộc tổ chức của user
      .getMany();
    const relationFormatterService = new RelationFormatterService();

    return data.map(position => {
      // Format the position with selected fields for department
      const formattedPosition = relationFormatterService.formatRelations(position, {
        department: ['id', 'departmentName'],
      });

      // If branch is at the same level as department (not nested within), handle it directly
      if (position.department.branch) {
        formattedPosition.branch = {
          id: position.department.branch.id,
          branchName: position.department.branch.branchName
        };
      }

      return formattedPosition;
    });

  }



  async findOne(id: number, user: User): Promise<PositionResponseDto> {
    // Chỉ truy vấn các trường cần thiết
    const position = await this.positionRepo
      .createQueryBuilder('position')
      .select([
        'position.id',
        'position.positionName',
        'position.isActive',
        'department.id',
        'department.departmentName',
        'branch.id',
        'branch.branchName',
      ])
      .innerJoin('position.department', 'department')
      .innerJoin('department.branch', 'branch')
      .innerJoin('branch.organization', 'organization')
      .where('position.id = :id', { id })
      .andWhere('organization.id = :organizationId', { organizationId: user.organization.id })
      .getOne();

    // Nếu không tìm thấy vị trí, trả về NotFoundException
    if (!position) {
      throw new NotFoundException(`Không tìm thấy vị trí với ID: ${id}.`);
    }

    // Định dạng lại thông tin position
    const formattedPosition = {
      id: position.id,
      positionName: position.positionName,
      isActive: position.isActive,
      department: {
        id: position.department.id,
        departmentName: position.department.departmentName,
      },
      branch: {
        id: position.department.branch.id,
        branchName: position.department.branch.branchName,
      },
    };

    return formattedPosition;
  }



  async findByDepartmentId(id: number, user: User): Promise<any> {
    const data = await this.positionRepo
      .createQueryBuilder('position')
      .innerJoin('position.department', 'department')
      .innerJoin('department.branch', 'branch')
      .innerJoin('branch.organization', 'organization')
      .select([
        'position.id',
        'position.positionName',
        'department.id',
        'department.departmentName',
        'branch.id',
        'branch.branchName',
      ]) // Chỉ lấy các trường cần thiết
      .where('department.id = :id', { id })
      .andWhere('organization.id = :organizationId', { organizationId: user.organization.id })
      .getMany();

    // Định dạng dữ liệu trả về (nếu cần thiết)
    return data.map(position => ({
      id: position.id,
      positionName: position.positionName,
      department: {
        id: position.department.id,
        departmentName: position.department.departmentName,
      },
      branch: {
        id: position.department.branch.id,
        branchName: position.department.branch.branchName,
      },
    }));
  }



  async update(id: number, updateDto: UpdatePositionDto, user: User): Promise<Position> {
    const { departmentId, positionName } = updateDto;

    // 1. Tìm position hiện tại để cập nhật
    const position = await this.findOne(id, user);

    // 2. Nếu departmentId thay đổi, kiểm tra department mới
    if (departmentId) {
      const department = await this.departmentRepo.findOne({
        where: { id: departmentId },
        relations: ['branch', 'branch.organization'],  // Lấy thông tin branch để kiểm tra
      });

      if (!department) {
        throw new NotFoundException({
          field: 'departmentId',
          errors: [`Phòng ban không tồn tại.`]
        });
      }

      // Kiểm tra xem branch của department có thuộc tổ chức của user không
      if (department.branch.organization.id !== user.organization.id) {
        throw new UnauthorizedException(
          {
            field: 'departmentId',
            errors: [`Phòng ban không tồn tại trong tổ chức.`]
          }
        );
      }

      // Cập nhật department nếu hợp lệ
      position.department = department;
    }

    // 3. Cập nhật tên vị trí (nếu thay đổi)
    if (positionName) {
      const existingPositionInDepartment = await this.positionRepo.findOne({
        where: {
          positionName,
          department: { id: position.department.id },
          id: Not(id) // Loại trừ position hiện tại
        },
      });

      if (existingPositionInDepartment) {
        throw new ConflictException(
          {
            field: 'positionName',
            errors: [`Vị trí '${positionName}' đã tồn tại trong phòng ban.`]
          }
        );
      }

      position.positionName = positionName;
    }

    // 5. Lưu các thay đổi
    return await this.positionRepo.save(position);
  }


  async remove(ids: number[], user: User): Promise<{ affectedPositions: number, notFoundIds: number[] }> {
    const currentTime = new Date();

    // 1. Tìm các Position có tồn tại trong danh sách ids và thuộc tổ chức của người dùng
    const positions = await this.positionRepo.createQueryBuilder('position')
      .innerJoin('position.department', 'department')
      .innerJoin('department.branch', 'branch')
      .innerJoin('branch.organization', 'organization')
      .where('position.id IN (:...ids)', { ids })
      .andWhere('organization.id = :organizationId', { organizationId: user.organization.id })
      .getMany();

    const existingPositionIds = positions.map(position => position.id);

    // 2. Tìm những id không tồn tại
    const notFoundIds = ids.filter(id => !existingPositionIds.includes(id));

    if (existingPositionIds.length === 0) {
      throw new NotFoundException('Không tìm thấy position nào để xóa.');
    }

    // 3. Cập nhật deletedAt cho các Position tìm thấy
    const updateResult = await this.positionRepo.update(
      { id: In(existingPositionIds) },
      { deletedAt: currentTime }
    );

    const affectedPositions = updateResult.affected || 0;

    // 4. Trả về kết quả, bao gồm những ids không tìm thấy
    return {
      affectedPositions,
      notFoundIds,
    };
  }

}
