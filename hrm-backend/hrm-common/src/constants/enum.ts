export enum Gender {
  Male = "Nam",
  Female = "Nữ",
  Other = "Khác",
}

export enum OwnerType {
  User = "User",
  Company = "Company",
}

export enum BankAccountStatus {
  Active = "Active",
  Inactive = "Inactive",
  Closed = "Closed",
}

export enum FormulaType {
  BASE_SALARY = 'BASE_SALARY',      // Lương cơ bản
  FIXED_COST = 'FIXED_COST',        // Chi phí cố định
  VARIABLE_COST = 'VARIABLE_COST',  // Chi phí biến động
  TIERED_COST = 'TIERED_COST',      // Chi phí theo định mức         
}

export enum ExpenseStatus {
  PENDING = 'PENDING',    // Chưa duyệt
  APPROVED = 'APPROVED',  // Đã duyệt
  REJECTED = 'REJECTED',  // Từ chối
}

export enum ExpenseCategory {
  SALARY = 'SALARY',
  OTHER = 'OTHER',
}

export enum ContractStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}


export enum JobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum JobType {
  IMPORT_SALARY_EXPENSE = 'IMPORT_SALARY_EXPENSE', // Nhập dữ liệu lương
  IMPORT_OTHER_EXPENSE = 'IMPORT_OTHER_EXPENSE',  // Nhập các loại chi phí khác
  EXPORT_SALARY_REPORT = 'EXPORT_SALARY_REPORT',  // Xuất báo cáo lương
  EXPORT_OTHER_REPORT = 'EXPORT_OTHER_REPORT',    // Xuất các báo cáo khác
}


export enum ExpenseTypeCategory {
  SALARY = 'SALARY',
  OTHER = 'OTHER',
  DEDUCTION = 'DEDUCTION', // Thêm loại chi phí giảm trừ
}
