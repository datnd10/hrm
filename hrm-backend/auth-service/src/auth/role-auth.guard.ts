import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { ROLES_KEY } from './role.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector, private jwtService: JwtService) { }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        // Get the required roles from the decorator
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // If no roles are required, allow access
        if (!requiredRoles) {
            return true;
        }

        // Get the request object to extract the user
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Check if the user's role matches any of the required roles
        return requiredRoles.includes(user.role);
    }
}
