import { BankAccountStatus, OwnerType } from "../constants/enum";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Expense } from "./expense.entity";

@Entity("bank-account")
export class BankAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 20 })
  accountNumber: string;

  @Column({ type: "varchar", length: 100 })
  accountName: string;

  @Column({ type: "varchar", length: 100 })
  bankName: string;

  @Column({ type: "int" })
  ownerId: number;

  @Column({
    type: "enum",
    enum: OwnerType,
  })
  ownerType: OwnerType;

  @Column({ type: "double", nullable: true })
  balance: number;

  @Column({ type: "timestamp", nullable: true })
  closingDate: Date;

  @Column({
    type: "enum",
    enum: BankAccountStatus,
    default: BankAccountStatus.Active,
  })
  status: BankAccountStatus;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt: Date;

  @OneToMany(() => Expense, (expense) => expense.bankAccount)
  expenses: Expense[];
}
