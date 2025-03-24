import { Module } from '@nestjs/common';
import { ExcelService } from './excel.service';
import { ExcelController } from './excel.controller';
import { BullModule } from '@nestjs/bull';
import { ExcelQueueModule } from './excel-queue.module';

@Module({
  imports: [ExcelQueueModule],
  controllers: [ExcelController],
  providers: [ExcelService],
})
export class ExcelModule { }
