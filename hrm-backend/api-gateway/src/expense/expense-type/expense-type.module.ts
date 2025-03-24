import { Module } from '@nestjs/common';
import { ExpenseTypeService } from './expense-type.service';
import { ExpenseTypeController } from './expense-type.controller';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { AuthKafkaModule } from 'src/module/auth-kafka.module';
import { ExpenseKafkaModule } from 'src/module/expense-kafka.module';


@Module({
  imports: [AuthKafkaModule, ExpenseKafkaModule],
  providers: [ExpenseTypeService, JwtAuthGuard, RolesGuard],
  controllers: [ExpenseTypeController],
})
export class ExpenseTypeModule { }
