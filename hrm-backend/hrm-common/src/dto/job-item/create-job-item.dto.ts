import { IsString, IsOptional, IsInt, IsEnum } from 'class-validator';
import { JobStatus } from '../../constants/enum';

export class CreateJobItemDto {
    @IsString()
    message: string;

    @IsInt()
    jobId: number;

    @IsEnum(JobStatus)
    status: JobStatus;
}
