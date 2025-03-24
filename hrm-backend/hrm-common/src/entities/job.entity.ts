import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne } from 'typeorm';
import { JobStatus, JobType } from '../constants/enum';
import { JobItem } from './job-item.entity';
import { Organization } from './organization.entity';

@Entity('jobs')
export class Job {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255 })
    name: string;

    @Column({
        type: 'enum',
        enum: JobStatus,
    })
    status: JobStatus;

    @Column({
        type: 'enum',
        enum: JobType,
    })
    type: JobType;

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date;

    @DeleteDateColumn({ type: "timestamp" })
    deletedAt: Date;

    @OneToMany(() => JobItem, (jobItem) => jobItem.job, {
        cascade: true,
        onDelete: 'CASCADE'
    })
    jobItems: JobItem[];

    @ManyToOne(() => Organization, (organization) => organization.jobs)
    organization: Organization
}
