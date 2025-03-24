import { Module } from '@nestjs/common';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';
import { AuthKafkaModule } from 'src/module/auth-kafka.module';
import { EmployeeKafkaModule } from 'src/module/employee-kafka.module';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@Module({
  imports: [AuthKafkaModule, EmployeeKafkaModule],
  controllers: [ContractController],
  providers: [ContractService, JwtAuthGuard, RolesGuard],
})
export class ContractModule { }
