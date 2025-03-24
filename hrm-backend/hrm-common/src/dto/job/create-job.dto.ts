import { IsString, IsEnum, IsOptional, ValidateNested, ArrayNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { JobStatus, JobType } from '../../constants/enum';
import { CreateJobItemDto } from '../job-item/create-job-item.dto';

export class CreateJobDto {
    @IsString()
    name: string;

    @IsOptional()
    status: JobStatus = JobStatus.PENDING; // Gán giá trị mặc định là PENDING

    @IsEnum(JobType)
    type: JobType;

    @ValidateNested({ each: true })
    @Type(() => CreateJobItemDto)
    jobItems: CreateJobItemDto[];
}
