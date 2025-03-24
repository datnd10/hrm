import { ClientProxy } from '@nestjs/microservices';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { delay, lastValueFrom, retry, retryWhen, take, timeout, TimeoutError, timer } from 'rxjs';

const logger = new Logger('ApiGateway');
// Exporting the function to make it reusable
// export async function sendMessageKafka<T>(client: ClientProxy, pattern: string, payload: any): Promise<T> {
//     const timeoutMs = 10000; // Timeout mặc định: 5 giây
//     const retries = 3; // Số lần retry mặc định: 3 lần

//     try {
//         // Log thông tin gửi request
//         logger.log(`Sending message to microservice: Pattern = ${pattern}, Payload = ${JSON.stringify(payload)}`);

//         // Gửi message với timeout và retry
//         return await lastValueFrom(
//             client.send<T>(pattern, payload).pipe(
//                 timeout(timeoutMs),
//                 retry({
//                     count: retries, // Số lần retry tối đa
//                     delay: (error, retryCount) => {
//                         logger.warn(
//                             `Retrying... Attempt ${retryCount}/${retries}. Error: ${error.message}`,
//                         );
//                         return timer(1000); // Delay giữa các lần retry là 1 giây
//                     },
//                 }),
//             ),
//         );
//     } catch (err) {
//         // Log lỗi chi tiết
//         logger.error(
//             `Error while communicating with microservice: Pattern = ${pattern}, Payload = ${JSON.stringify(payload)}, Error = ${err}`,
//         );

//         // Xử lý TimeoutError
//         if (err instanceof TimeoutError) {
//             throw new HttpException(
//                 {
//                     message: `Request to microservice timed out after ${timeoutMs} ms`,
//                     details: { pattern, payload },
//                 },
//                 HttpStatus.REQUEST_TIMEOUT,
//             );
//         }

//         // Xử lý các lỗi khác
//         const errorResponse = err?.response || err;

//         throw new HttpException(
//             {
//                 message: errorResponse?.message || 'An unexpected error occurred while communicating with microservice',
//                 details: { pattern, payload },
//             },
//             errorResponse?.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
//         );
//     }
// }

// // Exporting the function to make it reusable
export async function sendMessageKafka<T>(client: ClientProxy, pattern: string, payload: any): Promise<T> {
    try {
        return await lastValueFrom(client.send<T>(pattern, payload).pipe(timeout(30000)));
    } catch (err) {
        // Kiểm tra nếu lỗi là TimeoutError
        // if (err instanceof TimeoutError) {
        //     throw new HttpException(
        //         'Kafka request timed out after 5 seconds',
        //         HttpStatus.REQUEST_TIMEOUT,
        //     );
        // }

        // Xử lý các lỗi khác
        const errorResponse = err?.response || err;

        throw new HttpException(
            errorResponse?.message || 'An unexpected error occurred',
            errorResponse?.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }
}

