import { Module } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { AuthKafkaModule } from 'src/module/auth-kafka.module';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { EmployeeKafkaModule } from 'src/module/employee-kafka.module';

@Module({
  imports: [AuthKafkaModule, EmployeeKafkaModule],
  controllers: [EmployeeController],
  providers: [EmployeeService, JwtAuthGuard, RolesGuard],
})
export class EmployeeModule {}
