import { Module } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { DepartmentController } from './department.controller';
import { CompanyKafkaModule } from 'src/module/company-kafka.module';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { AuthKafkaModule } from 'src/module/auth-kafka.module';

@Module({
  imports: [CompanyKafkaModule, AuthKafkaModule],
  controllers: [DepartmentController],
  providers: [DepartmentService, JwtAuthGuard, RolesGuard],
})
export class DepartmentModule {}
