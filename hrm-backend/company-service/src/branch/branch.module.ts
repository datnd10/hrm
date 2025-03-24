import { Module } from '@nestjs/common';
import { BranchService } from './branch.service';
import { BranchController } from './branch.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Branch } from '@shared/entities/branch.entity';
import { CommonModule } from '@shared/util/common.module'
import { Department } from '@shared/entities/department.entity';
import { Position } from '@shared/entities/position.entity';
@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([Branch, Department, Position]),
  ],
  controllers: [BranchController],
  providers: [BranchService],
})
export class BranchModule { }
