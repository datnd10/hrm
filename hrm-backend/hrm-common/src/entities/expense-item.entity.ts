import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, } from 'typeorm';
import { Expense } from './expense.entity';
import { ExpenseType } from './expense-type.entity';

@Entity('expense_item')
export class ExpenseItem {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    expenseItemName: string;

    @Column()
    quantity: number;

    @Column({ default: 0 })  // Gán giá trị mặc định là 0
    baseQuantity: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })  // Gán giá trị mặc định là 0
    taxRate: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })  // Gán giá trị mặc định là 0
    discount: number;

    @Column({ default: 0 })
    price: number;

    @Column()
    totalAmount: number;

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date;

    @DeleteDateColumn({ type: "timestamp" })
    deletedAt: Date;

    @ManyToOne(() => Expense, (expense) => expense.expenseItems)
    expense: Expense;

    @ManyToOne(() => ExpenseType, (expenseType) => expenseType.expenseItems)
    expenseType: ExpenseType;
}
