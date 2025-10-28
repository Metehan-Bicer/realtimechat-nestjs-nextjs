import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export type Role = 'OWNER' | 'ADMIN' | 'MEMBER';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

