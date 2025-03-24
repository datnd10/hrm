import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
} from "typeorm";
import { Department } from "./department.entity";
import { Position } from "./position.entity";
import { Gender } from "../constants/enum";
import { User } from "./user.entity";
import { Expense } from "./expense.entity";
import { Contract } from "./contract.entity";

@Entity("employee")
export class Employee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fullName: string;

  @Column({
    type: "enum",
    enum: Gender,
    default: Gender.Male,
  })
  gender: Gender;

  @Column()
  dateOfBirth: string;

  @Column({ nullable: true })
  idCard: string;

  @Column({ nullable: true })
  taxCode: string;

  @Column()
  email: string;

  @Column()
  phoneNumber: string;

  @Column({ nullable: true })
  province: string;

  @Column({ nullable: true })
  district: string;

  @Column({ nullable: true })
  ward: string;

  @Column({ nullable: true })
  specificAddress: string;

  @Column({ nullable: true })
  avatar: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt: Date;

  @OneToOne(() => User, (user) => user.employee)
  @JoinColumn()
  user: User;

  @OneToMany(() => Contract, (contract) => contract.employee)
  contracts: Contract[];

  @OneToMany(() => Expense, (expense) => expense.employee)
  expenses: Expense[];

  @ManyToOne(() => Department, (department) => department.employees)
  department: Department;

  @ManyToOne(() => Position, (position) => position.employees)
  position: Position;
}
