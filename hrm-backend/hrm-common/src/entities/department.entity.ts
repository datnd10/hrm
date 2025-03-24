import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Branch } from "./branch.entity";
import { Position } from "./position.entity";
import { Employee } from "./employee.entity";

@Entity("department")
export class Department {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  departmentName: string;

  @ManyToOne(() => Department, (department) => department.childDepartments, {
    nullable: true,
  })
  parentDepartment: Department;

  @OneToMany(() => Department, (department) => department.parentDepartment)
  childDepartments: Department[];

  @ManyToOne(() => Branch, (branch) => branch.departments)
  branch: Branch;

  @OneToMany(() => Position, (position) => position.department)
  positions: Position[];

  @OneToMany(() => Employee, (employee) => employee.department)
  employees: Employee[]; // Thêm mối quan hệ này

  @Column({ default: true }) // Đặt giá trị mặc định cho status là true
  isActive: boolean;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt: Date;
}
