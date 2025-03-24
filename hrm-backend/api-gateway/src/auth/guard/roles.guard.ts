import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.get<number[]>('roles', context.getHandler()) ||
            this.reflector.get<number[]>('roles', context.getClass());

        if (!requiredRoles) {
            return true; // If no roles are specified, allow access
        }

        const request = context.switchToHttp().getRequest();



        const user = request.user;



        return requiredRoles.includes(user.roleId); // Check if the user's role is allowed
    }
}
