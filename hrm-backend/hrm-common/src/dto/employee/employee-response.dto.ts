export class EmployeeResponseDto {
    id: number;
    fullName: string;
    gender: string;
    dateOfBirth: string;
    idCard?: string;
    taxCode?: string;
    email: string;
    phoneNumber: string;
    province?: string;
    district?: string;
    ward?: string;
    specificAddress?: string;
    avatar?: string;
    user: {
        id: number;
        roleId: number;
    };
    position: {
        id: number;
        positionName: string;
    };
    department: {
        id: number;
        departmentName: string;
    };
    branch: {
        id: number;
        branchName: string;
    };
    bankAccount: {
        id: number;
        accountNumber: string;
        accountName: string;
        bankName: string;
    }
}
