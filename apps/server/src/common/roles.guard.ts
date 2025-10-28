import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from './roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    // Attach your auth logic to fetch user + membership role
    const request = context.switchToHttp().getRequest();
    const user = request.user as { id: string; role?: Role } | undefined;
    if (!user || !user.role) return false;
    return required.includes(user.role);
  }
}

