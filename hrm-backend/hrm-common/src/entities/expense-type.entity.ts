import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne } from 'typeorm';
import { ExpenseTypeCategory, FormulaType } from '../constants/enum';
import { ExpenseItem } from './expense-item.entity';
import { ExpenseRange } from './expense-range.entity';
import { Organization } from './organization.entity';

@Entity('expense_type')
export class ExpenseType {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({
        type: 'enum',
        enum: ExpenseTypeCategory
    })
    type: ExpenseTypeCategory;

    @Column({ type: 'decimal', nullable: true })
    basePrice: number | null;

    @Column({
        type: 'enum',
        enum: FormulaType,
    })
    formulaType: FormulaType;

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date;

    @DeleteDateColumn({ type: "timestamp" })
    deletedAt: Date;

    @OneToMany(() => ExpenseItem, (expense) => expense.expenseType)
    expenseItems: ExpenseItem[];

    @OneToMany(() => ExpenseRange, (range) => range.expenseType)
    expenseRanges: ExpenseRange[];

    @ManyToOne(() => Organization, (organization) => organization.expenseTypes)
    organization: Organization;
}
