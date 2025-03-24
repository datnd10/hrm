import { Module } from '@nestjs/common';
import { PositionService } from './position.service';
import { PositionController } from './position.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Position } from '@shared/entities/position.entity';
import { Department } from '@shared/entities/department.entity';
import { CommonModule } from '@shared/util/common.module';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([Position, Department])],
  controllers: [PositionController],
  providers: [PositionService],
})
export class PositionModule { }
