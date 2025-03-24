import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BranchModule } from './company/branch/branch.module';
import { DepartmentModule } from './company/department/department.module';
import { PositionModule } from './company/position/position.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationModule } from './company/organization/organization.module';
import { EmployeeModule } from './employee/employee.module';
import { BankAccountModule } from './bank-account/bank-account.module';
import { ExpenseTypeModule } from './expense/expense-type/expense-type.module';
import { ExpenseModule } from './expense/expense/expense.module';
import { BullModule } from '@nestjs/bull';
import { ContractModule } from './contract/contract.module';
import { JobModule } from './job/job.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.development',
    }),
    // BullModule.forRoot({
    //   redis: {
    //     host: 'localhost',
    //     port: 6379,
    //   },
    // }),
    // BullModule.registerQueue(
    //   { name: 'import-salary' },
    // ),
    BranchModule,
    DepartmentModule,
    PositionModule,
    AuthModule,
    OrganizationModule,
    EmployeeModule,
    BankAccountModule,
    ExpenseTypeModule,
    ExpenseModule,
    ContractModule,
    JobModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
