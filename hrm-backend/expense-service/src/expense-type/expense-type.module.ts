import { Module } from '@nestjs/common';
import { ExpenseTypeService } from './expense-type.service';
import { ExpenseTypeController } from './expense-type.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpenseType } from '@shared/entities/expense-type.entity';
import { ExpenseRange } from '@shared/entities/expense-range.entity';
import { CommonModule } from '@shared/util/common.module';
@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([ExpenseType, ExpenseRange])],
  controllers: [ExpenseTypeController],
  providers: [ExpenseTypeService],
})
export class ExpenseTypeModule { }
