import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject, OnModuleInit } from '@nestjs/common';
import { ClientKafka, ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(@Inject('AUTH_SERVICE') private readonly authClient: ClientProxy) { }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader) {
            throw new UnauthorizedException('Authorization header is missing');
        }

        const token = authHeader.split(' ')[1];

        return this.authClient.send('validate_jwt', token).pipe(
            map((response) => {
                if (!response) {
                    throw new UnauthorizedException('Invalid token');
                }
                request.user = response;
                return true;
            }),
            catchError(() => {
                throw new UnauthorizedException('Invalid token');
            }),
        );
    }
}
