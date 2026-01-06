import { TRPCError } from '@trpc/server';
import type { TrpcContext } from '../_core/context.js';

/**
 * Superadmin Middleware
 *
 * Checks if the authenticated user's email matches the SUPERADMIN_EMAIL environment variable.
 *
 * Security:
 * - MUST use environment variable (not hardcoded email)
 * - Requires user to be authenticated first
 * - Returns 403 Forbidden if user is not superadmin
 *
 * Usage:
 * Apply this middleware to routes that require superadmin access (Docker management, database queries, system logs)
 */
export function requireSuperadmin(ctx: TrpcContext) {
  // Check if user is authenticated
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }

  // Check if SUPERADMIN_EMAIL is configured
  const superadminEmail = process.env.SUPERADMIN_EMAIL;
  if (!superadminEmail) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Superadmin access not configured',
    });
  }

  // Check if user email matches superadmin email
  if (ctx.user.email !== superadminEmail) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Superadmin access required',
    });
  }

  // User is superadmin - allow access
}
