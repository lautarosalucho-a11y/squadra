import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export interface AuthUser {
  userId: string;
  email: string;
}

/**
 * Inyecta el usuario autenticado (extraído del JWT por GqlAuthGuard).
 * Uso: `metodo(@CurrentUser() user: AuthUser) {}`
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.user;
  },
);
