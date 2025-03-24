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
import { Department } from "./department.entity";
import { Employee } from "./employee.entity"; // Import entity Employee

@Entity("position")
export class Position {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  positionName: string;

  @ManyToOne(() => Department, (department) => department.positions)
  department: Department;

  @OneToMany(() => Employee, (employee) => employee.position) // Thêm mối quan hệ này
  employees: Employee[];

  @Column({ default: true }) // Đặt giá trị mặc định cho status là true
  isActive: boolean;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt: Date;
}
