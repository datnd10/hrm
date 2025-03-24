export interface ExpenseType {
  id?: number;
  description: string;
  totalAmount: number;
  textRate: number;
  preAmount: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
