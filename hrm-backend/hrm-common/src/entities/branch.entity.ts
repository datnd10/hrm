import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { Department } from "./department.entity";
import { User } from "./user.entity";
import { Organization } from "./organization.entity";
import { Expense } from "./expense.entity";

@Entity("branch")
export class Branch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  branchName: string;

  @Column({ nullable: true })
  province: string;

  @Column({ nullable: true })
  district: string;

  @Column({ nullable: true })
  ward: string;

  @Column({ nullable: true })
  specificAddress: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  taxCode: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt: Date;

  @OneToMany(() => Department, (department) => department.branch)
  departments: Department[];

  @OneToMany(() => Expense, (expense) => expense.branch)
  expenses: Expense[];

  @ManyToOne(() => Organization, (organization) => organization.branches)
  organization: Organization;
}
