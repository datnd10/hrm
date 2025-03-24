export class ResponseUserDto {
    id: number;

    email: string;

    roleId: number;

    isActive: boolean;

    organization: {
        id: number;
        organizationName: string;
    };
}
