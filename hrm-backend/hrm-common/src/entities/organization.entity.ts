import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";
import { Branch } from "./branch.entity";
import { Expense } from "./expense.entity";
import { ExpenseType } from "./expense-type.entity";
import { Job } from "./job.entity";

@Entity('organization')
export class Organization {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    organizationName: string;

    @OneToMany(() => User, (user) => user.organization)
    users: User[];

    @OneToMany(() => Branch, (branch) => branch.organization)
    branches: Branch[];

    @OneToMany(() => ExpenseType, (expenseType) => expenseType.organization)
    expenseTypes: ExpenseType[];

    @OneToMany(() => Job, (job) => job.organization)
    jobs: Job[];
}