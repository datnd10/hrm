import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { JobStatus } from '@shared/constants/enum';
import { CreateJobDto } from '@shared/dto/job/create-job.dto';
import { UpdateJobDto } from '@shared/dto/job/update-job.dto';
import { User } from '@shared/entities/user.entity';
import { Job } from 'bull';
import { sendMessageKafka } from 'src/common/kafka.helper';

@Injectable()
export class JobService {
  constructor(
    @Inject('JOB_SERVICE')
    private readonly jobClient: ClientKafka,
  ) { }

  async create(
    createJobDto: CreateJobDto,
    user: User,
  ): Promise<any> {
    const payload = {
      createJobDto,
      user,
    };
    return sendMessageKafka<Job>(
      this.jobClient,
      'add-job',
      JSON.stringify(payload),
    );
  }

  async findAll(user: User): Promise<any> {

    return sendMessageKafka<any>(
      this.jobClient,
      'find-all-job',
      JSON.stringify(user),
    );
  }

  async filterJob(
    user: User,
    options: { page: number; limit: number },
    filters: {
      search?: string;
      status?: JobStatus;
      sortBy?: string;
      sortDirection?: 'ASC' | 'DESC';
    })
    : Promise<Job[]> {
    return sendMessageKafka<Job[]>(
      this.jobClient,
      'filter-job',
      JSON.stringify({ user, options, filters }),
    );
  }

  async findOne(id: number, user: User): Promise<Job> {
    return sendMessageKafka<Job>(
      this.jobClient,
      'find-one-job',
      JSON.stringify({ id, user }),
    );
  }

  async update(
    id: number,
    updateJobDto: UpdateJobDto,
    user: User,
  ): Promise<Job> {
    return sendMessageKafka<Job>(
      this.jobClient,
      'update-job',
      JSON.stringify({
        id,
        updateJobDto,
        user,
      }),
    );
  }

  async remove(ids: number[], user: User): Promise<void> {
    return sendMessageKafka<void>(
      this.jobClient,
      'remove-job',
      {
        ids,
        user,
      },
    );
  }
}
