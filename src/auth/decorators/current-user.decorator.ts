import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserJwtPayload } from '../typs/user-jwt-payload.type';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserJwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
