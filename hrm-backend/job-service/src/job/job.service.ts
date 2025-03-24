import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JobStatus } from '@shared/constants/enum';
import { CreateJobDto } from '@shared/dto/job/create-job.dto';
import { UpdateJobDto } from '@shared/dto/job/update-job.dto';
import { Job } from '@shared/entities/job.entity';
import { User } from '@shared/entities/user.entity';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { Repository } from 'typeorm';

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
  ) { }
  create(createJobDto: CreateJobDto) {
    return 'This action adds a new job';
  }

  async findAll(data: any): Promise<Job[]> {
    console.log(data);

    return await this.jobRepository.find({
      where: { organization: data.organization },
    });
  }


  async findOne(id: number): Promise<any> {
    const job = await this.jobRepository.findOne({
      where: { id },
      relations: ['jobItems'],
    });

    if (!job) {
      throw new NotFoundException(
        `Job với ID ${id} không được tìm thấy.`,
      );
    }

    // Chỉ loại bỏ các trường trong jobItems
    const jobItems = job.jobItems.map(({ createdAt, updatedAt, deletedAt, ...jobItem }) => jobItem);

    return {
      ...job, // Giữ nguyên các trường bên ngoài
      jobItems, // Gán jobItems đã xử lý
    };
  }

  async filterJob(
    user: User,
    options: IPaginationOptions,
    filters: {
      search: string;
      sortBy: string;
      status: JobStatus;
      sortDirection: 'ASC' | 'DESC';
    },
  ): Promise<Pagination<any>> {
    // Tạo query builder cho việc lọc ExpenseTypeF
    const queryBuilder =
      this.jobRepository.createQueryBuilder('job')
        .where('job.organizationId = :organizationId', { organizationId: user.organization.id });

    // Thêm bộ lọc tìm kiếm nếu có
    if (filters.search) {
      queryBuilder.andWhere('job.name LIKE :search', {
        search: `%${filters.search}%`,
      });
    }

    // Thêm bộ lọc isSalary nếu có
    if (filters.status) {
      queryBuilder.andWhere('job.status = :status', {
        status: filters.status,
      });
    }


    queryBuilder.orderBy(filters.sortBy, filters.sortDirection);

    // Thực hiện phân trang và trả về kết quả
    const paginatedResults = await paginate<Job>(queryBuilder, options);

    // Trả về kết quả phân trang đã format
    return paginatedResults;
  }


  update(id: number, updateJobDto: UpdateJobDto) {
    return `This action updates a #${id} job`;
  }

  remove(id: number) {
    return `This action removes a #${id} job`;
  }
}
