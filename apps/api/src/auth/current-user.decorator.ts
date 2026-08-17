import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { User, UserProfile } from '@prisma/client';

export type AuthenticatedUser = User & { profile?: UserProfile | null };

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
