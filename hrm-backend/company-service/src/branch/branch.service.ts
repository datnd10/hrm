import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateBranchDto } from '@shared/dto/branch/create-branch.dto';
import { UpdateBranchDto } from '@shared/dto/branch/update-branch.dto';
import { Branch } from '@shared/entities/branch.entity';
import { Department } from '@shared/entities/department.entity';
import { Position } from '@shared/entities/position.entity';
import { User } from '@shared/entities/user.entity';
import { RelationFormatterService } from '@shared/util/relation-formatter.service';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { In, Repository } from 'typeorm';

@Injectable()
export class BranchService {
  constructor(
    @InjectRepository(Branch) private branchRepo: Repository<Branch>,
    @InjectRepository(Department)
    private departmentRepo: Repository<Department>,
    @InjectRepository(Position) private positionRepo: Repository<Position>,
    private readonly relationFormatter: RelationFormatterService,
  ) { }

  async initBranch(data: any) {
    console.log(data);

    const branch = this.branchRepo.create({
      branchName: data.branchName,
      organization: { id: data.organizationId },
    });

    return await this.branchRepo.save(branch);
  }

  async checkForDuplicate(
    field: keyof CreateBranchDto,
    value: string,
    organizationId: number,
    branchId?: number,
  ): Promise<boolean> {
    const query = this.branchRepo
      .createQueryBuilder('branch')
      .where(`branch.${field} = :value`, { value })
      .andWhere('branch.deletedAt IS NULL')
      .andWhere('branch.organizationId = :organizationId', { organizationId });

    if (branchId) {
      query.andWhere('branch.id != :branchId', { branchId });
    }

    const existingBranch = await query.getOne();
    return !!existingBranch;
  }

  async create(createBranchDto: CreateBranchDto, user: User) {
    const {
      branchName,
      province,
      district,
      ward,
      specificAddress,
      phoneNumber,
      email,
      taxCode,
    } = createBranchDto;

    let duplicateErrors = [];

    const duplicateBranchName = await this.checkForDuplicate(
      'branchName',
      branchName,
      user.organization.id,
    );
    if (duplicateBranchName) {
      duplicateErrors.push({
        field: 'branchName',
        errors: ['Tên chi nhánh đã tồn tại trong hệ thống.'],
      });
    }

    const duplicateEmail = await this.checkForDuplicate(
      'email',
      email,
      user.organization.id,
    );
    if (duplicateEmail) {
      duplicateErrors.push({
        field: 'email',
        errors: ['Email đã tồn tại trong hệ thống.'],
      });
    }

    const duplicatePhoneNumber = await this.checkForDuplicate(
      'phoneNumber',
      phoneNumber,
      user.organization.id,
    );
    if (duplicatePhoneNumber) {
      duplicateErrors.push({
        field: 'phoneNumber',
        errors: ['SĐT đã tồn tại trong hệ thống.'],
      });
    }

    const duplicateTaxCode = await this.checkForDuplicate(
      'taxCode',
      taxCode,
      user.organization.id,
    );
    if (duplicateTaxCode) {
      duplicateErrors.push({
        field: 'taxCode',
        errors: ['MST đã tồn tại trong hệ thống.'],
      });
    }

    if (duplicateErrors.length > 0) {
      throw new HttpException(duplicateErrors, HttpStatus.CONFLICT);
    }
    const branch = this.branchRepo.create({
      branchName,
      province,
      district,
      ward,
      specificAddress,
      phoneNumber,
      email,
      taxCode,
      organization: {
        id: user.organization.id,
      },
    });
    return await this.branchRepo.save(branch);
  }
  async findAll(user: User): Promise<Branch[]> {
    const branch = await this.branchRepo.find({
      where: { organization: { id: user.organization.id } },
    });
    return branch;
  }

  async filterBranch(user: User, options: IPaginationOptions, filters: any): Promise<Pagination<Branch>> {
    const queryBuilder = this.branchRepo.createQueryBuilder('branch');

    // Lọc theo organizationId của người dùng
    queryBuilder.where('branch.organizationId = :organizationId', { organizationId: user.organization.id });

    // Tìm kiếm theo tên chi nhánh nếu có
    if (filters.search) {
      queryBuilder.andWhere('branch.branchName LIKE :search', { search: `%${filters.search}%` });
    }

    // Lọc theo trạng thái isActive nếu có
    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('branch.isActive = :isActive', { isActive: filters.isActive });
    }

    // Thêm sắp xếp theo cột được truyền vào và hướng sắp xếp
    queryBuilder.orderBy(`branch.${filters.sortBy}`, filters.sortDirection);

    // Thực hiện phân trang với thư viện paginate
    return paginate<Branch>(queryBuilder, options);
  }

  async findOne(id: number, user: User): Promise<Branch> {
    const branch = await this.branchRepo.findOne({
      where: { id, organization: { id: user.organization.id } },
    });
    if (!branch) {
      throw new HttpException(
        `Chi nhánh không được tìm thấy.`,
        HttpStatus.NOT_FOUND,
      );
    }
    return branch;
  }

  async update(branchId: number, updateBranchDto: UpdateBranchDto, user: User) {
    const {
      branchName,
      province,
      district,
      ward,
      specificAddress,
      phoneNumber,
      email,
      taxCode,
    } = updateBranchDto;

    const existingBranch = await this.findOne(branchId, user);

    if (!existingBranch) {
      throw new HttpException(
        'Chi nhánh không được tìm thấy.',
        HttpStatus.NOT_FOUND,
      );
    }

    let duplicateErrors = [];

    const duplicateBranchName = await this.checkForDuplicate(
      'branchName',
      branchName,
      user.organization.id,
      branchId,
    );
    if (duplicateBranchName) {
      duplicateErrors.push({
        field: 'branchName',
        errors: ['Tên chi nhánh đã tồn tại trong hệ thống.'],
      });
    }

    const duplicateEmail = await this.checkForDuplicate(
      'email',
      email,
      user.organization.id,
      branchId,
    );
    if (duplicateEmail) {
      duplicateErrors.push({
        field: 'email',
        errors: ['Email đã tồn tại trong hệ thống.'],
      });
    }

    const duplicatePhoneNumber = await this.checkForDuplicate(
      'phoneNumber',
      phoneNumber,
      user.organization.id,
      branchId,
    );
    if (duplicatePhoneNumber) {
      duplicateErrors.push({
        field: 'phoneNumber',
        errors: ['SĐT đã tồn tại trong hệ thống.'],
      });
    }

    const duplicateTaxCode = await this.checkForDuplicate(
      'taxCode',
      taxCode,
      user.organization.id,
      branchId,
    );
    if (duplicateTaxCode) {
      duplicateErrors.push({
        field: 'taxCode',
        errors: ['MST đã tồn tại trong hệ thống.'],
      });
    }

    if (duplicateErrors.length > 0) {
      throw new HttpException(duplicateErrors, HttpStatus.CONFLICT);
    }

    if (branchName) existingBranch.branchName = branchName;
    if (province) existingBranch.province = province;
    if (district) existingBranch.district = district;
    if (ward) existingBranch.ward = ward;
    if (specificAddress) existingBranch.specificAddress = specificAddress;
    if (phoneNumber) existingBranch.phoneNumber = phoneNumber;
    if (email) existingBranch.email = email;
    if (taxCode) existingBranch.taxCode = taxCode;

    existingBranch.organization = user.organization;

    return await this.branchRepo.save(existingBranch);
  }

  async remove(
    ids: number[],
    user: User,
  ): Promise<{
    affectedBranches: number;
    affectedDepartments: number;
    affectedPositions: number;
    notFoundIds: number[];
  }> {
    const currentTime = new Date();

    // 1. Tìm các Branch có tồn tại trong danh sách ids
    const existingBranches = await this.branchRepo.find({
      where: { id: In(ids), organization: { id: user.organization.id } },
    });

    const existingBranchIds = existingBranches.map((branch) => branch.id);

    // 2. Tìm những id không tồn tại
    const notFoundIds = ids.filter((id) => !existingBranchIds.includes(id));

    if (existingBranchIds.length === 0) {
      throw new NotFoundException('Không tìm thấy các chi nhánh muốn xóa.');
    }

    // 3. Tìm tất cả các Department liên quan đến Branch tồn tại
    const departments = await this.departmentRepo.find({
      where: { branch: In(existingBranchIds) },
    });
    const departmentIds = departments.map((department) => department.id);

    let affectedPositions = 0;
    if (departmentIds.length > 0) {
      // 4. Cập nhật deletedAt cho các Position trước khi cập nhật Department
      const positions = await this.positionRepo.find({
        where: { department: In(departmentIds) },
      });
      if (positions.length > 0) {
        const positionUpdateResult = await this.positionRepo.update(
          { department: In(departmentIds) },
          { deletedAt: currentTime },
        );
        affectedPositions = positionUpdateResult.affected || 0;
      }
    }

    // 5. Cập nhật deletedAt cho các Department liên quan đến Branch tồn tại
    const departmentUpdateResult = await this.departmentRepo.update(
      { branch: In(existingBranchIds) },
      { deletedAt: currentTime },
    );
    const affectedDepartments = departmentUpdateResult.affected || 0;

    // 6. Cập nhật deletedAt cho các Branch tồn tại
    const branchUpdateResult = await this.branchRepo.update(
      { id: In(existingBranchIds) },
      { deletedAt: currentTime },
    );
    const affectedBranches = branchUpdateResult.affected || 0;

    // Trả về kết quả, bao gồm những ids không tìm thấy
    return {
      affectedBranches,
      affectedDepartments,
      affectedPositions,
      notFoundIds,
    };
  }
}
