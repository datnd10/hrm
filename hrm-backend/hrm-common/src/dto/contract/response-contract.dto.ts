import { ContractStatus } from "../../constants/enum";

export class ResponseContractDTO {
    id: number;
    contractName: string;
    startDate: Date;
    endDate: Date | null;
    salary: number;
    description: string | null;
    status: ContractStatus;
    employee: {
        id: number;
        fullName: string;
    };
    branch: {
        id: number;
        branchName: string;
    };
    department: {
        id: number;
        departmentName: string;
    };
    position: {
        id: number;
        positionName: string;
    };
}
