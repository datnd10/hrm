import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { ExpenseService } from './expense.service';
import { JobStatus, JobType } from '@shared/constants/enum';

@Processor('expense-queue')
export class ExpenseProcessor {
    constructor(private readonly expenseService: ExpenseService) { }

    @Process('process-import')
    async handleImport(job: Job) {
        console.log(`Processing job ${job.id} with data:`, job.data);

        const { file, type, user } = job.data;
        let savedJob = null; // Khởi tạo mặc định là null

        try {
            const now = new Date();
            const formattedDate = `${now.getDate()}_${now.getMonth() + 1}_${now.getFullYear()}`;
            const name = type === "SALARY" ? `TINHLUONG_${formattedDate}_${job.id}` : `CHIPHI_${formattedDate}_${job.id}`;

            const jobType = type === "SALARY" ? JobType.IMPORT_SALARY_EXPENSE : JobType.IMPORT_OTHER_EXPENSE;

            // Lưu thông tin job vào database trước khi xử lý
            savedJob = await this.expenseService.saveJob(name, jobType, user);

            await this.expenseService.saveLog(
                savedJob.id,
                `Đọc dữ liệu từ Excel`,
                JobStatus.COMPLETED
            );

            // Gọi Excel Service để xử lý file
            const records = await this.expenseService.handleExcelProcessing(file, type, user);



            console.log(records);


            console.log(`Total records fetched: ${records.length}`);

            const validatedRecords = [];
            let hasErrors = false;

            // Validate toàn bộ bản ghi
            for (const record of records) {
                try {
                    const validatedRecord = await this.expenseService.validateExpenses(record, type);
                    if (!validatedRecord) {
                        throw new Error(`Invalid record: ${JSON.stringify(record)}`);
                    }
                    validatedRecords.push(validatedRecord);
                } catch (validationError) {
                    hasErrors = true;
                    // Lưu log lỗi cho các bản ghi không hợp lệ
                    console.error(`Validation failed for record:`, record, validationError.message);
                    await this.expenseService.saveLog(
                        savedJob.id,
                        `${validationError.message}`,
                        JobStatus.FAILED
                    );
                }
            }

            console.log(`Validation completed. Valid records: ${validatedRecords.length}, Errors: ${hasErrors}`);

            // Kiểm tra trạng thái: nếu có lỗi, không lưu bản ghi nào vào database
            if (hasErrors) {
                console.log(`Job ${job.id} contains errors. No records will be saved to the database.`);
                await this.expenseService.updateJobStatus(savedJob.id, JobStatus.FAILED);
                return;
            }

            console.log(`All records validated successfully. Proceeding to save...`);

            // Lưu tất cả các bản ghi hợp lệ vào database
            for (const validatedRecord of validatedRecords) {
                const savedRecord = await this.expenseService.create(validatedRecord);
                console.log(`Record saved successfully with ID: ${savedRecord.id}`);

                // Lưu log thành công cho từng bản ghi
                await this.expenseService.saveLog(
                    savedJob.id,
                    `Tạo bản ghi với ID: ${savedRecord.id}`,
                    JobStatus.COMPLETED
                );
            }

            // Cập nhật trạng thái job
            await this.expenseService.updateJobStatus(savedJob.id, JobStatus.COMPLETED);
            console.log(`Job ${job.id} completed successfully.`);
        } catch (error) {
            console.error(`Job ${job.id} failed:`, error.message);

            // Nếu savedJob đã được tạo, ghi log lỗi và cập nhật trạng thái
            if (savedJob) {
                await this.expenseService.saveLog(
                    savedJob.id,
                    `${error.message}`,
                    JobStatus.FAILED
                );
                await this.expenseService.updateJobStatus(savedJob.id, JobStatus.FAILED);
            } else {
                console.error(`Failed to initialize job ${job.id}:`, error.message);
            }
        }
    }
}
