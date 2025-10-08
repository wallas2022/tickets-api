import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

// Clave con la que guardaremos los roles en los metadatos de Nest
export const ROLES_KEY = 'roles';

// Decorador que acepta uno o varios roles válidos (ADMIN, AGENT, CUSTOMER)
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
