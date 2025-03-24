import { Module } from '@nestjs/common';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from '@shared/entities/employee.entity';
import { Contract } from '@shared/entities/contract.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, Contract]),],
  controllers: [ContractController],
  providers: [ContractService],
})
export class ContractModule { }
