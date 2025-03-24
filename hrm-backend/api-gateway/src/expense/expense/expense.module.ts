import { Module } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { AuthKafkaModule } from 'src/module/auth-kafka.module';
import { ExpenseKafkaModule } from 'src/module/expense-kafka.module';
import { ExpenseController } from './expense.controller';

@Module({
  imports: [AuthKafkaModule, ExpenseKafkaModule],
  controllers: [ExpenseController],
  providers: [ExpenseService],
})
export class ExpenseModule { }
