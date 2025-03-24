import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { JobService } from './job.service';
import { CreateJobDto } from '@shared/dto/job/create-job.dto';
import { handleError } from '@shared/util/error-handler';
import { UpdateJobDto } from '@shared/dto/job/update-job.dto';

@Controller('job')
export class JobController {
  constructor(private readonly jobService: JobService) { }

  @MessagePattern('add-job')
  create(@Payload() createJobDto: CreateJobDto) {
    return this.jobService.create(createJobDto);
  }

  @MessagePattern('find-all-job')
  async findAll(@Payload() data: any) {
    try {
      const result = await this.jobService.findAll(data);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('filter-job')
  async filterJob(@Payload() data: any) {
    try {
      const { user, options, filters } = data;
      const result = await this.jobService.filterJob(
        user,
        options,
        filters,
      );
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }

  @MessagePattern('find-one-job')
  async findOne(@Payload() data: any) {
    const { id, user } = data;

    try {
      const result = await this.jobService.findOne(id);
      return JSON.stringify(result);
    } catch (error) {
      handleError(error);
    }
  }


  @MessagePattern('update-job')
  update(@Payload() updateJobDto: UpdateJobDto) {
    return this.jobService.update(1, updateJobDto);
  }

  @MessagePattern('remove-job')
  remove(@Payload() id: number) {
    return this.jobService.remove(id);
  }
}
