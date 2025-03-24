import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

export function handleError(error: any): never {
    throw new RpcException({
        message: error?.response || error?.message || 'Hệ thống đang có lỗi. Vui lòng thử lại sau.',
        statusCode: error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
    });
}
