import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { ExpenseType } from './expense-type.entity';

@Entity('expense_range')
export class ExpenseRange {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    minRange: number;

    @Column()
    maxRange: number;

    @Column()
    price: number;

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date;

    @DeleteDateColumn({ type: "timestamp" })
    deletedAt: Date;

    @ManyToOne(() => ExpenseType, (expenseType) => expenseType.expenseRanges)
    expenseType: ExpenseType; // Liên kết đến loại chi phí
}
