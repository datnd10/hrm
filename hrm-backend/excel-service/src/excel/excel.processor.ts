import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { ExcelService } from './excel.service';

@Processor('excel-queue')
export class ExcelProcessor {
    constructor(private readonly excelService: ExcelService) { }

    // @Process('process-excel-file')
    // async handleProcessExcelFile(job: Job) {
    //     console.log(`Processing Excel file for job ${job.id}:`, job.data);

    //     try {
    //         const result = await this.excelService.importExcel(job.data.buffer, job.data.headers);
    //         console.log(`Excel file processed successfully for job ${job.id}`);
    //         return result;
    //     } catch (error) {
    //         console.error(`Error processing job ${job.id}:`, error.message);
    //         throw new Error(`Failed to process Excel file: ${error.message}`);
    //     }
    // }
}
