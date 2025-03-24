import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, } from 'typeorm';
import { Job } from './job.entity';
import { JobStatus } from '../constants/enum';

@Entity('job_item')
export class JobItem {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255 })
    message: string;

    @Column({
        type: 'enum',
        enum: JobStatus,
    })
    status: JobStatus;

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date;

    @DeleteDateColumn({ type: "timestamp" })
    deletedAt: Date;

    @ManyToOne(() => Job, (job) => job.jobItems)
    job: Job;
}
