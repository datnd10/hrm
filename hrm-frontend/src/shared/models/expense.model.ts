export interface Expense {
  id?: number;
  name: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
