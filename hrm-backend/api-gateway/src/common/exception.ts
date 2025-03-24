import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();


        console.log('ccc', exception.getResponse());


        const exceptionResponse: any = exception.getResponse();

        let message;

        if (Array.isArray(exceptionResponse)) {
            // Nếu exceptionResponse là một mảng, gán nó trực tiếp vào message
            message = exceptionResponse;
        } else if (typeof exceptionResponse === 'object') {
            if (exceptionResponse.message) {
                message = exceptionResponse.message; // if message field exists
            } else if (exceptionResponse.field && exceptionResponse.errors) {
                // If the response contains field and errors directly (like in your case)
                message = [{ field: exceptionResponse.field, errors: exceptionResponse.errors }];
            } else {
                message = 'Hệ thống đang có lỗi. Vui bạn thử lại sau.';
            }
        } else {
            message = exceptionResponse || 'Hệ thống đang có lỗi. Vui bạn thử lại sau. ';
        }

        console.log('zzz', message);

        response.status(200).json({
            statusCode: status, // Include the original HTTP status code here
            message: message,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
}
