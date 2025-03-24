export class DepartmentResponseDto {
    id: number;
    departmentName: string;
    branch: {
        id: number;
        branchName: string;
    };
    childDepartments: DepartmentResponseDto[];
    parentDepartment: {
        id: number;
        departmentName: string;
        branch: {
            id: number;
            branchName: string;
        };
    } | null;
}
