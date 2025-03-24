import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Employee } from "./employee.entity";
import { ContractStatus } from "../constants/enum";

@Entity("contract")
export class Contract {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  contractName: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  salary: number;

  @ManyToOne(() => Employee, (employee) => employee.contracts)
  employee: Employee;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ type: 'enum', enum: ContractStatus, default: ContractStatus.ACTIVE })
  status: ContractStatus;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt: Date;
}
