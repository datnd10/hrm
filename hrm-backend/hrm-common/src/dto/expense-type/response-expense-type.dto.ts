import { ExpenseTypeCategory } from "../../constants/enum";

export class ResponseExpenseTypeDto {
    id: number;
    name: string;
    description: string;
    type: ExpenseTypeCategory;
}