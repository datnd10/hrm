import { Module } from '@nestjs/common';
import { BranchService } from './branch.service';
import { BranchController } from './branch.controller';
import { CompanyKafkaModule } from 'src/module/company-kafka.module';
import { AuthKafkaModule } from 'src/module/auth-kafka.module';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';

@Module({
  imports: [CompanyKafkaModule, AuthKafkaModule],
  controllers: [BranchController],
  providers: [BranchService, JwtAuthGuard, RolesGuard],
})
export class BranchModule { }
