import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    UseInterceptors,
    ClassSerializerInterceptor,
    RequestTimeoutException,
} from '@nestjs/common';
import { Observable, TimeoutError } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

interface ClassConstructor {
    new(...args: any[]): {};
}

export function Serialize(dto: ClassConstructor) {
    return UseInterceptors(new ClassSerializerInterceptor(dto));
}
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            catchError((err) => {
                if (err instanceof TimeoutError) {
                    throw new RequestTimeoutException(); // Trả về lỗi nếu quá thời gian chờ
                }
                throw err; // Ném lỗi nếu đó không phải là timeout
            }),
            map((data) => {
                return {
                    code: context.switchToHttp().getResponse().statusCode,
                    message: 'Operation completed successfully!',
                    data: data,
                };
            }),
        );
    }
}
