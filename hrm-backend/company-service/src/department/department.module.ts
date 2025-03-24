import { Module } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { DepartmentController } from './department.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from '@shared/entities/department.entity';
import { Branch } from '@shared/entities/branch.entity';
import { Position } from '@shared/entities/position.entity';
import { CommonModule } from '@shared/util/common.module';
@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([Department, Branch, Position])],
  controllers: [DepartmentController],
  providers: [DepartmentService],
})
export class DepartmentModule { }
