import { SetMetadata } from '@nestjs/common';

// Define the key for the role metadata
export const ROLES_KEY = 'roles';

// Create a custom decorator for setting roles
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
