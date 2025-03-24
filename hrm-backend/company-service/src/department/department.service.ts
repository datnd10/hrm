
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateDepartmentDto } from '@shared/dto/department/create-department.dto';
import { UpdateDepartmentDto } from '@shared/dto/department/update-department.dto';
import { Branch } from '@shared/entities/branch.entity';
import { Department } from '@shared/entities/department.entity';
import { Position } from '@shared/entities/position.entity';
import { User } from '@shared/entities/user.entity';
import { RelationFormatterService } from '@shared/util/relation-formatter.service';
import { In, Not, Repository } from 'typeorm';
import { DepartmentResponseDto } from '@shared/dto/department/response-department.dto';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(Department)
    private departmentRepo: Repository<Department>,

    @InjectRepository(Branch) private branchRepo: Repository<Branch>,

    @InjectRepository(Position) private positionRepo: Repository<Position>,
  ) { }

  async create(
    createDto: CreateDepartmentDto,
    user: User,
  ): Promise<Department> {
    const { branchId, departmentName, parentDepartmentId } = createDto;

    // Kiểm tra xem branch có thuộc tổ chức của người dùng không
    const branch = await this.branchRepo.findOne({
      where: { id: branchId, organization: user.organization, deletedAt: null },
    });

    if (!branch) {
      throw new NotFoundException({
        field: 'branchId',
        errors: ['Chi nhánh không tồn tại trong tổ chức.']
      });
    }

    // Kiểm tra trùng tên department trong cùng branch
    const existingDepartmentInBranch = await this.departmentRepo.findOne({
      where: { departmentName, branch: { id: branchId }, deletedAt: null },
    });

    if (existingDepartmentInBranch) {
      throw new ConflictException({
        field: 'departmentName',
        errors: [`Phòng ban có tên là '${departmentName}' đã tồn tại trong chi nhánh`],
      });
    }

    let parentDepartment = null;

    // Kiểm tra xem parentDepartmentId có tồn tại không (nếu có)
    if (parentDepartmentId) {
      parentDepartment = await this.departmentRepo.findOne({
        where: { id: parentDepartmentId, branch: { id: branchId } }, // Kiểm tra xem parentDepartment có thuộc cùng branch không
      });

      if (!parentDepartment) {
        throw new NotFoundException({
          field: 'parentDepartmentId',
          errors: ['Phòng ban cha không tồn tại trong chi nhánh.'],
        });
      }

      // Kiểm tra xem phòng ban cha và phòng ban con có giống nhau không
    }

    // Tiếp tục tạo department
    const department = this.departmentRepo.create({
      departmentName,
      parentDepartment: parentDepartment, // Gán parentDepartment nếu tồn tại
      branch,
    });

    return await this.departmentRepo.save(department);
  }


  async findAll(user: User): Promise<DepartmentResponseDto[]> {
    // Lấy tất cả các department cấp cao nhất (root)
    const rootDepartments = await this.departmentRepo
      .createQueryBuilder('department')
      .innerJoinAndSelect('department.branch', 'branch')  // Lấy branch của department
      .leftJoinAndSelect('department.childDepartments', 'childDepartments')
      .leftJoinAndSelect('department.parentDepartment', 'parentDepartment')  // Lấy parentDepartment
      .where('branch.organizationId = :organizationId', {
        organizationId: user.organization.id,
      })
      .andWhere('department.parentDepartment IS NULL')  // Chỉ lấy các root departments
      .getMany();

    // Đệ quy để lấy các cây con cho mỗi department và gắn branch, parentDepartment cho tất cả các cấp con
    const departmentTree = await Promise.all(
      rootDepartments.map(async (department) => {
        return this.buildDepartmentTree(department, department.branch);
      })
    );

    return departmentTree;
  }



  private async buildDepartmentTree(department: Department, branch: Branch): Promise<DepartmentResponseDto> {
    // Chuẩn bị dữ liệu branch cho department hiện tại
    const branchData = {
      id: branch.id,
      branchName: branch.branchName,
    };

    // Nếu department có parentDepartment, lấy thông tin parentDepartment và gắn thông tin branch vào
    let parentDepartmentData = null;
    if (department.parentDepartment) {
      const parentDepartment = await this.departmentRepo
        .createQueryBuilder('department')
        .leftJoinAndSelect('department.branch', 'branch')
        .where('department.id = :parentId', { parentId: department.parentDepartment.id })
        .getOne();
      if (parentDepartment) {
        parentDepartmentData = {
          id: parentDepartment.id,
          departmentName: parentDepartment.departmentName,
          branch: {
            id: parentDepartment.branch.id,
            branchName: parentDepartment.branch.branchName,
          },
        };
      }
    }

    // Lấy các department con (childDepartments)
    const childDepartments = await this.departmentRepo
      .createQueryBuilder('department')
      .leftJoinAndSelect('department.parentDepartment', 'parentDepartment')
      .leftJoinAndSelect('department.branch', 'branch')
      .where('department.parentDepartment.id = :parentId', { parentId: department.id })
      .getMany();

    // Nếu department có childDepartments, gọi đệ quy để lấy thêm các con
    const formattedChildDepartments = await Promise.all(
      childDepartments.map(async (child) => {
        return this.buildDepartmentTree(child, branch);
      })
    );

    // Trả về thông tin department đã format
    return {
      id: department.id,
      departmentName: department.departmentName,
      branch: branchData,
      parentDepartment: parentDepartmentData,
      childDepartments: formattedChildDepartments,
    };
  }

  async findOne(id: number, user: User): Promise<Department> {
    console.log(user);
    console.log(id);

    const department = await this.departmentRepo
      .createQueryBuilder('department')
      .innerJoinAndSelect('department.branch', 'branch')
      .where('department.id = :id', { id })
      .andWhere('branch.organizationId = :organizationId', {
        organizationId: user.organization.id,
      })
      .leftJoinAndSelect('department.parentDepartment', 'parentDepartment')
      .getOne();

    if (!department) {
      throw new NotFoundException(
        `Phòng ban không được tìm thấy trong hệ thống.`,
      );
    }

    const relationFormatterService = new RelationFormatterService();
    const relationFields = {
      branch: ['id', 'branchName'],
      parentDepartment: ['id', 'departmentName'],
    };

    return relationFormatterService.formatRelations(department, relationFields);
  }

  async findDepartmentByBranch(id: number): Promise<Department[]> {
    const departments = await this.departmentRepo
      .createQueryBuilder('department')
      .innerJoin('department.branch', 'branch')
      .select(['department.id', 'department.departmentName', 'branch.id']) // Chỉ lấy các trường cần thiết
      .where('branch.id = :id', { id })
      .getMany();

    console.log(departments);


    if (departments.length === 0) {
      const branchExists = await this.branchRepo
        .createQueryBuilder('branch')
        .select(['branch.id']) // Chỉ kiểm tra sự tồn tại
        .where('branch.id = :id', { id })
        .getOne();

      if (!branchExists) {
        throw new NotFoundException(
          `Chi nhánh không được tìm thấy trong hệ thống.`,
        );
      }
    }

    return departments;
  }


  async update(
    id: number,
    updateDto: UpdateDepartmentDto,
    user: User,
  ): Promise<Department> {
    const { branchId, departmentName, parentDepartmentId } = updateDto;

    // Tìm department hiện tại và liên kết với branch của nó
    const department = await this.findOne(id, user);

    // Kiểm tra chi nhánh mới (nếu branchId thay đổi)
    if (branchId) {
      const branch = await this.branchRepo.findOne({
        where: { id: branchId, organization: user.organization }, // Kiểm tra branch có thuộc cùng tổ chức không
      });

      if (!branch) {
        throw new NotFoundException({
          field: 'branchId',
          errors: [`Chi nhánh không tồn tại trong hệ thống.`],
        });
      }

      department.branch = branch; // Cập nhật branch nếu kiểm tra thành công
    }

    // Nếu tên department thay đổi, kiểm tra trùng lặp tên trong cùng tổ chức (kiểm tra qua branch)
    if (departmentName) {
      const existingDepartmentInBranch = await this.departmentRepo.findOne({
        where: {
          departmentName,
          branch: { id: department.branch.id }, // Kiểm tra trong các branch thuộc cùng tổ chức
          id: Not(id), // Loại trừ department hiện tại
        },
      });

      if (existingDepartmentInBranch) {
        throw new ConflictException({
          field: 'departmentName',
          errors: [`Phòng ban có tên là ${departmentName} đã tồn tại trong chi nhánh.`],
        });
      }

      department.departmentName = departmentName; // Cập nhật tên department nếu kiểm tra thành công
    }

    // Kiểm tra parentDepartmentId nếu có cập nhật
    if (parentDepartmentId) {
      // Kiểm tra parentDepartment thuộc cùng chi nhánh
      const parentDepartment = await this.departmentRepo.findOne({
        where: { id: parentDepartmentId, branch: { id: department.branch.id } }, // Kiểm tra parentDepartment có thuộc cùng branch không
      });

      if (!parentDepartment) {
        throw new NotFoundException({
          field: 'parentDepartmentId',
          errors: [
            `Phòng ban cha không được tìm thấy trong chi nhánh.`,
          ]
        }
        );
      }

      if (parentDepartment.id === department.id) {
        throw new BadRequestException(
          {
            field: 'departmentName',
            errors: [
              `Phòng ban cha và phòng ban con thông nhau.`,
            ]
          }
        );
      }
      department.parentDepartment = parentDepartment; // Cập nhật parentDepartment nếu kiểm tra thành công
    } else {
      department.parentDepartment = null;
    }
    return await this.departmentRepo.save(department);
  }

  async remove(
    ids: number[],
    user: User,
  ): Promise<{
    affectedDepartments: number;
    affectedPositions: number;
    affectedChildDepartments: number;
    notFoundIds: number[];
  }> {
    const currentTime = new Date();

    // 1. Tìm các Department tồn tại trong danh sách ids và thuộc tổ chức của user
    const existingDepartments = await this.departmentRepo.find({
      where: {
        id: In(ids),
        branch: { organization: user.organization },
        deletedAt: null,
      }, // Chỉ tìm các department chưa bị xóa
    });

    const existingDepartmentIds = existingDepartments.map(
      (department) => department.id,
    );

    // 2. Tìm những id không tồn tại
    const notFoundIds = ids.filter((id) => !existingDepartmentIds.includes(id));

    if (existingDepartmentIds.length === 0) {
      throw new NotFoundException('Không tìm thấy các department cần xóa.');
    }

    // 3. Tìm tất cả các Position liên quan đến các Department tồn tại
    const positions = await this.positionRepo.find({
      where: { department: In(existingDepartmentIds) },
    });
    let affectedPositions = 0;

    if (positions.length > 0) {
      // 4. Cập nhật deletedAt cho các Position trước khi cập nhật Department
      const positionUpdateResult = await this.positionRepo.update(
        { department: In(existingDepartmentIds) },
        { deletedAt: currentTime },
      );
      affectedPositions = positionUpdateResult.affected || 0;
    }

    // 5. Cập nhật deletedAt cho các Department (cha)
    const departmentUpdateResult = await this.departmentRepo.update(
      { id: In(existingDepartmentIds) },
      { deletedAt: currentTime },
    );
    const affectedDepartments = departmentUpdateResult.affected || 0;

    // 6. Tìm và cập nhật tất cả các Department con (child departments) có parentDepartment bị xóa
    const childDepartments = await this.departmentRepo.find({
      where: { parentDepartment: In(existingDepartmentIds) },
    });

    const childDepartmentIds = childDepartments.map(
      (department) => department.id,
    );

    let affectedChildDepartments = 0;
    if (childDepartmentIds.length > 0) {
      // 7. Cập nhật deletedAt cho các Department con
      const childDepartmentUpdateResult = await this.departmentRepo.update(
        { id: In(childDepartmentIds) },
        { deletedAt: currentTime },
      );
      affectedChildDepartments = childDepartmentUpdateResult.affected || 0;

      // 8. Xóa mềm tất cả các Position liên quan đến Department con
      const childPositions = await this.positionRepo.find({
        where: { department: In(childDepartmentIds) },
      });
      if (childPositions.length > 0) {
        const childPositionUpdateResult = await this.positionRepo.update(
          { department: In(childDepartmentIds) },
          { deletedAt: currentTime },
        );
        affectedPositions += childPositionUpdateResult.affected || 0;
      }
    }

    // Trả về kết quả
    return {
      affectedDepartments,
      affectedPositions,
      affectedChildDepartments, // Số lượng child department bị xóa
      notFoundIds,
    };
  }
}
