import { Module } from '@nestjs/common';
import { ExpenseController } from './expense.controller';
import { ExpenseService } from './expense.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from '@shared/entities/expense.entity';
import { ExpenseItem } from '@shared/entities/expense-item.entity';
import { Branch } from '@shared/entities/branch.entity';
import { ExpenseType } from '@shared/entities/expense-type.entity';
import { Employee } from '@shared/entities/employee.entity';
import { Department } from '@shared/entities/department.entity';
import { ExpenseRange } from '@shared/entities/expense-range.entity'
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Job } from '@shared/entities/job.entity';
import { JobItem } from '@shared/entities/job-item.entity';
import { BankAccount } from '@shared/entities/bank-account.entity';
import { Contract } from '@shared/entities/contract.entity';
import { ExpenseQueueModule } from './expense-queue.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ClientsModule.registerAsync([
      {
        name: 'EXCEL_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'expense-service',
              brokers: configService
                .get<string>('KAFKA_BROKERS')
                ?.split(','),
              connectionTimeout: 5000,
              retry: {
                retries: 10,
                initialRetryTime: 300,
                maxRetryTime: 5000,
              },
            },
            consumer: {
              groupId: 'expense-service-consumer',
              heartbeatInterval: 3000,
              sessionTimeout: 15000,
              maxWaitTimeInMs: 10000,
            },
          },
        }),
      },
    ]),
    TypeOrmModule.forFeature([Expense, ExpenseItem, Branch, ExpenseType, BankAccount, Employee, Department, ExpenseRange, Contract, Job, JobItem]),
    ExpenseQueueModule,
  ],
  controllers: [ExpenseController],
  providers: [ExpenseService],
})
export class ExpenseModule { }
