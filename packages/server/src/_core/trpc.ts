import { initTRPC, TRPCError } from '@trpc/server';
import type { TrpcContext } from './context';

/**
 * Initialize tRPC with context type
 */
const t = initTRPC.context<TrpcContext>().create();

/**
 * Export router and procedure helpers
 */
export const router = t.router;
export const middleware = t.middleware;

/**
 * Public procedure - No authentication required
 *
 * Usage: Landing pages, client portal public endpoints
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure - Requires authentication
 *
 * Usage: 90% of API endpoints
 *
 * Features:
 * - Throws UNAUTHORIZED if no user in context
 * - Type narrows ctx.user to non-null User
 */
export const protectedProcedure = t.procedure.use(async (opts) => {
  if (!opts.ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  return opts.next({
    ctx: {
      ...opts.ctx,
      user: opts.ctx.user, // Type narrowing: User (non-null)
    },
  });
});

/**
 * Admin procedure - Requires admin role
 *
 * Usage: Admin panel, global stats, user management
 *
 * Features:
 * - Throws UNAUTHORIZED if no user
 * - Throws FORBIDDEN if user is not admin
 */
export const adminProcedure = t.procedure.use(async (opts) => {
  if (!opts.ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  if (opts.ctx.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You must be an admin to access this resource',
    });
  }

  return opts.next({
    ctx: {
      ...opts.ctx,
      user: opts.ctx.user,
    },
  });
});
