import { Role } from '@prisma/client';

/**
 * Este tipo representa la información del usuario
 * que se incluye dentro del token JWT y se inyecta
 * en `req.user` cuando el guard JWT valida el token.
 */
export interface UserJwtPayload {
  userId: string;
  email: string;
  role: Role;
}
