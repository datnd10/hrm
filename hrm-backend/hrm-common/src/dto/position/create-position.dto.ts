import { IsInt, IsNotEmpty, IsString } from "class-validator";

export class CreatePositionDto {
    @IsNotEmpty({ message: "Tên chúc vụ phải bắt buộc." })
    @IsString({ message: "Tên chúc vụ phải phải là chữ." })
    positionName: string;

    @IsNotEmpty({ message: "Phòng ban phải bắt buộc." })
    @IsInt({ message: "Phòng ban phải phải là số dương." })
    departmentId: number;
}