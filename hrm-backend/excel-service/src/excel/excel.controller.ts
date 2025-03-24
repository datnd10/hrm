import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { ExcelService } from './excel.service';
import { ExpenseCategory, JobType } from '@shared/constants/enum';
@Controller()
export class ExcelController {
  constructor(private readonly excelService: ExcelService) { }

  @MessagePattern('export')

  async handleExportExpense(@Payload() payload: any): Promise<{ buffer: string, filename: string }> {
    const { data, headers, title, entityMapping, type, branches } = payload;

    const parsedMapping = Object.fromEntries(
      Object.entries(entityMapping).map(([key, value]) => [key, typeof value === 'string' ? eval(value) : value])
    );
    let buffer: Buffer;
    let filename: string;
    if (type === ExpenseCategory.SALARY) {
      buffer = await this.excelService.exportSalaryExcel(data, headers, title, parsedMapping);
      filename = 'Template_Bang_Luong.xlsx';
    }
    else {
      buffer = await this.excelService.exportExpenseExcel(data, headers, title, parsedMapping, branches);
      filename = 'Template_Chi_Phi.xlsx';
    }
    return {
      buffer: buffer.toString('base64'), // Convert buffer to Base64 for transmission
      filename,
    };
  }

  @MessagePattern('import')
  async handleImportExpense(@Payload() payload: any) {
    try {
      const { buffer, headers, jobType } = payload;

      const fileBuffer = Buffer.from(buffer.data);

      // Danh sách các loại công việc và hàm xử lý tương ứng
      const jobHandlers = {
        [JobType.IMPORT_SALARY_EXPENSE]: () => this.excelService.importSalaryExcel(fileBuffer, headers),
        [JobType.IMPORT_OTHER_EXPENSE]: () => this.excelService.importExpenseExcel(fileBuffer, headers),
      };

      // Xử lý công việc dựa trên type
      if (jobHandlers[jobType]) {
        return await jobHandlers[jobType]();
      }

      throw new RpcException({
        status: 'error',
        message: `Unsupported job type: ${jobType}`,
      });
    } catch (error) {
      throw new RpcException({
        status: 'error',
        message: error.message,
      });
    }
  }
}
