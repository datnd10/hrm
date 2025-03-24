import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, OneToOne } from 'typeorm';
import { Branch } from './branch.entity';
import { Organization } from './organization.entity';
import { Employee } from './employee.entity';

@Entity('user')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, length: 255 })  // varchar field with length 255 for email
    email: string;

    @Column({ length: 255 })  // varchar field with length 255 for password
    password: string;

    @Column({ default: 1 })
    roleId: number;

    @Column({ default: false })  // Match table definition as isActive
    isActive: boolean;

    @Column({ nullable: true })
    otp: string;

    @Column({ nullable: true })
    otpExpires: Date;

    @OneToOne(() => Employee, (employee) => employee.user, { nullable: true })
    employee: Employee;

    @Column({ type: 'timestamp', nullable: true })  // Correcting the lastLogin to timestamp type
    lastLogin: Date;

    @ManyToOne(() => Organization, (organization) => organization.users)
    organization: Organization;
}
