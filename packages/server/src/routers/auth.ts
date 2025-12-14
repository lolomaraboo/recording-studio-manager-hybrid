import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../_core/trpc';

/**
 * Auth Router
 *
 * Endpoints:
 * - login: Authenticate user (TODO: real auth)
 * - logout: Clear session
 * - me: Get current user
 */
export const authRouter = router({
  /**
   * Get current authenticated user
   */
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return null;
    }

    return {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name,
      role: ctx.user.role,
      organizationId: ctx.organizationId,
    };
  }),

  /**
   * Login (mock implementation)
   * TODO: Replace with real auth SDK
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
      })
    )
    .mutation(async ({ input }) => {
      // TODO: Real authentication
      // For now, return mock success
      return {
        success: true,
        user: {
          id: 1,
          email: input.email,
          name: 'Mock User',
          role: 'user' as const,
        },
      };
    }),

  /**
   * Logout
   */
  logout: protectedProcedure.mutation(async ({ ctx: _ctx }) => {
    // TODO: Clear session/cookies
    return { success: true };
  }),
});
