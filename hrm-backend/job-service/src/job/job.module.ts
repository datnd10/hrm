import { Module } from '@nestjs/common';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { CommonDbModule } from '@shared/config/database/common-db.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from '@shared/entities/job.entity';
import { JobItem } from '@shared/entities/job-item.entity';

@Module({
  imports: [CommonDbModule, TypeOrmModule.forFeature([Job, JobItem])],
  controllers: [JobController],
  providers: [JobService],
})
export class JobModule { }
