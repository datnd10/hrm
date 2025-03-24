import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne } from 'typeorm';
import { Employee } from './employee.entity';
import { ExpenseItem } from './expense-item.entity';
import { Branch } from './branch.entity';
import { ExpenseStatus, ExpenseCategory, } from '../constants/enum';
import { BankAccount } from './bank-account.entity';

@Entity('expenses')
export class Expense {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    expenseName: string;

    @Column()
    totalAmount: number;

    @Column()
    billingCycle: string;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    taxRate: number;

    @Column({ type: 'enum', enum: ExpenseStatus, default: ExpenseStatus.PENDING })
    status: ExpenseStatus;

    @Column()
    preTaxAmount: number;

    @Column({ type: 'timestamp', nullable: true })
    expenseDate: Date;  // New field for "ngày chi" with datetime


    @ManyToOne(() => BankAccount, (bankAccount) => bankAccount.expenses, { nullable: true })
    bankAccount: BankAccount;

    @Column({
        type: 'enum',
        enum: ExpenseCategory,
    })
    type: ExpenseCategory;

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date;

    @DeleteDateColumn({ type: "timestamp" })
    deletedAt: Date;

    @ManyToOne(() => Employee, (employee) => employee.expenses, { nullable: true })
    employee: Employee;

    @ManyToOne(() => Branch, (branch) => branch.expenses)
    branch: Branch;

    @OneToMany(() => ExpenseItem, (expenseItem) => expenseItem.expense, {
        cascade: true,
        onDelete: 'CASCADE'
    })
    expenseItems: ExpenseItem[]
}
