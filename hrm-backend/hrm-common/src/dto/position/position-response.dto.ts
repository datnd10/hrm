export class PositionResponseDto {
    id: number;
    positionName: string;
    isActive: boolean;
    department: {
        id: number;
        departmentName: string;
    };
    branch: {
        id: number;
        branchName: string;
    };
}
