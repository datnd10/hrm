import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@shared/entities/user.entity';

export const GetUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): User => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;  // Thông tin người dùng đã được xác thực trong request
    },
);
