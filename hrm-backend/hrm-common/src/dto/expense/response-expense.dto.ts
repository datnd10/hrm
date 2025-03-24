import { ExpenseStatus, ExpenseCategory } from "../../constants/enum";

// Employee DTO chỉ lấy id và fullName
export class EmployeeResponseDto {
    id: number;
    fullName: string;
}

// Branch DTO chỉ lấy id và branchName
export class BranchResponseDto {
    id: number;
    branchName: string;
}

export class ExpenseTypeResponseDto {
    id: number;
    name: string;
}

export class ExpenseItemResponseDto {
    id: number;
    expenseItemName: string;
    totalAmount: number;
    quantity: number;
    price: number;
    baseQuantity: number;
    discount: number;
    taxRate: number;
    // expenseType: ExpenseTypeResponseDto;
}

// DTO phản hồi chính cho Expense
export class ExpenseResponseDto {
    id: number;
    expenseName: string;
    billingCycle: string;
    totalAmount: number;
    taxRate: number;
    preTaxAmount: number;
    expenseDate: Date;
    type: ExpenseCategory;
    createdAt: Date;
    updatedAt: Date;
    employee: EmployeeResponseDto;
    branch: BranchResponseDto;
    expenseItems?: ExpenseItemResponseDto[];
    status: ExpenseStatus;
}
