import { Module } from '@nestjs/common';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { AuthKafkaModule } from 'src/module/auth-kafka.module';
import { JobKafkaModule } from 'src/module/job-kafka.module';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';

@Module({
  imports: [AuthKafkaModule, JobKafkaModule],
  controllers: [JobController],
  providers: [JobService, JwtAuthGuard, RolesGuard],
})
export class JobModule { }
