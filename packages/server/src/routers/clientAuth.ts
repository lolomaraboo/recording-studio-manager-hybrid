import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { router, publicProcedure } from '../_core/trpc';
import { clients } from '@rsm/database/tenant';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  getRefreshTokenFromCookie,
  type TokenPayload,
} from '../_core/auth';

/**
 * Client Auth Router
 *
 * Authentication for client portal (separate from staff auth).
 * Clients authenticate against their tenant database, not the master DB.
 *
 * Endpoints:
 * - login: Authenticate client with email/password
 * - logout: Clear refresh token cookie
 * - me: Get current authenticated client
 * - refresh: Get new access token using refresh token
 * - setPassword: Set/change client portal password (requires valid invite or existing session)
 */
export const clientAuthRouter = router({
  /**
   * Client portal login
   *
   * Clients log in using their email and password.
   * The organization is determined by the request subdomain or header.
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        organizationSlug: z.string().optional(), // For multi-tenant routing
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Get tenant DB - organization must be determined from context (subdomain/header)
      const tenantDb = await ctx.getTenantDb();

      // 1. Find client by email
      const [client] = await tenantDb
        .select()
        .from(clients)
        .where(eq(clients.email, input.email.toLowerCase()))
        .limit(1);

      if (!client) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      // 2. Check if client has portal access
      if (!client.portalAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Portal access is not enabled for this account',
        });
      }

      // 3. Check if client is active
      if (!client.isActive) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Your account has been deactivated',
        });
      }

      // 4. Check if password is set
      if (!client.passwordHash) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Please set your password first using the invitation link',
        });
      }

      // 5. Verify password
      const isValidPassword = await verifyPassword(input.password, client.passwordHash);
      if (!isValidPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      // 6. Update last login timestamp
      await tenantDb
        .update(clients)
        .set({ portalLastLogin: new Date() })
        .where(eq(clients.id, client.id));

      // 7. Generate tokens
      const tokenPayload: TokenPayload = {
        userId: client.id, // Client ID in this context
        email: client.email!,
        role: 'client',
        organizationId: ctx.organizationId,
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      // 8. Set refresh token cookie
      setRefreshTokenCookie(ctx.res, refreshToken);

      return {
        accessToken,
        expiresIn: 15 * 60, // 15 minutes in seconds
        client: {
          id: client.id,
          name: client.name,
          artistName: client.artistName,
          email: client.email,
          isVip: client.isVip,
        },
      };
    }),

  /**
   * Get current authenticated client
   */
  me: publicProcedure.query(async ({ ctx }) => {
    // Check if user is a client (role === 'client')
    if (!ctx.user || ctx.user.role !== 'client') {
      return null;
    }

    const tenantDb = await ctx.getTenantDb();

    const [client] = await tenantDb
      .select({
        id: clients.id,
        name: clients.name,
        artistName: clients.artistName,
        email: clients.email,
        phone: clients.phone,
        isVip: clients.isVip,
        portalLastLogin: clients.portalLastLogin,
      })
      .from(clients)
      .where(eq(clients.id, ctx.user.id))
      .limit(1);

    if (!client) {
      return null;
    }

    return client;
  }),

  /**
   * Client logout - clear refresh token cookie
   */
  logout: publicProcedure.mutation(async ({ ctx }) => {
    clearRefreshTokenCookie(ctx.res);
    return { success: true };
  }),

  /**
   * Refresh access token using refresh token cookie
   */
  refresh: publicProcedure.mutation(async ({ ctx }) => {
    const refreshToken = getRefreshTokenFromCookie(ctx.req);

    if (!refreshToken) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'No refresh token provided',
      });
    }

    // 1. Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded || decoded.role !== 'client') {
      clearRefreshTokenCookie(ctx.res);
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired refresh token',
      });
    }

    // 2. Verify client still exists and has portal access
    const tenantDb = await ctx.getTenantDb();
    const [client] = await tenantDb
      .select()
      .from(clients)
      .where(eq(clients.id, decoded.userId))
      .limit(1);

    if (!client || !client.isActive || !client.portalAccess) {
      clearRefreshTokenCookie(ctx.res);
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Client not found or access revoked',
      });
    }

    // 3. Generate new access token
    const tokenPayload: TokenPayload = {
      userId: client.id,
      email: client.email!,
      role: 'client',
      organizationId: decoded.organizationId,
    };

    const accessToken = generateAccessToken(tokenPayload);

    // 4. Rotate refresh token
    const newRefreshToken = generateRefreshToken(tokenPayload);
    setRefreshTokenCookie(ctx.res, newRefreshToken);

    return {
      accessToken,
      expiresIn: 15 * 60,
    };
  }),

  /**
   * Set or change client portal password
   *
   * Can be called:
   * 1. With a valid invite token (first-time setup)
   * 2. By an authenticated client (password change)
   */
  setPassword: publicProcedure
    .input(
      z.object({
        clientId: z.number(),
        newPassword: z.string().min(8),
        currentPassword: z.string().optional(), // Required if changing existing password
        inviteToken: z.string().optional(), // For first-time setup
      })
    )
    .mutation(async ({ input, ctx }) => {
      const tenantDb = await ctx.getTenantDb();

      // Find the client
      const [client] = await tenantDb
        .select()
        .from(clients)
        .where(eq(clients.id, input.clientId))
        .limit(1);

      if (!client) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found',
        });
      }

      // Check portal access
      if (!client.portalAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Portal access is not enabled for this account',
        });
      }

      // If password already exists, require current password or admin token
      if (client.passwordHash) {
        if (!input.currentPassword) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Current password is required to change password',
          });
        }

        const isValid = await verifyPassword(input.currentPassword, client.passwordHash);
        if (!isValid) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Current password is incorrect',
          });
        }
      }

      // TODO: Validate inviteToken if provided (for first-time setup)
      // This would involve checking a separate invite_tokens table

      // Hash and save new password
      const passwordHash = await hashPassword(input.newPassword);

      await tenantDb
        .update(clients)
        .set({
          passwordHash,
          updatedAt: new Date(),
        })
        .where(eq(clients.id, input.clientId));

      return { success: true };
    }),
});
