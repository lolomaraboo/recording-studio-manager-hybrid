import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, and } from 'drizzle-orm';
import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { getMasterDb } from '@rsm/database/connection';
import { users, organizationMembers, organizations } from '@rsm/database/master';
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
import { logAuth, AuditActions } from '../_core/audit';

/**
 * Auth Router
 *
 * Endpoints:
 * - login: Authenticate user with email/password, returns JWT
 * - logout: Clear refresh token cookie
 * - me: Get current authenticated user
 * - refresh: Get new access token using refresh token
 * - register: Create new user account
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
   * Login with email and password
   * Returns access token in response body
   * Sets refresh token in httpOnly cookie
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const masterDb = await getMasterDb();

      // 1. Find user by email
      const [user] = await masterDb
        .select()
        .from(users)
        .where(eq(users.email, input.email.toLowerCase()))
        .limit(1);

      if (!user) {
        // Log failed login attempt
        await logAuth(AuditActions.AUTH_LOGIN_FAILED, ctx, {
          userEmail: input.email,
          status: 'failure',
          errorMessage: 'User not found',
        });
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      // 2. Check if user is active
      if (!user.isActive) {
        await logAuth(AuditActions.AUTH_LOGIN_FAILED, ctx, {
          userId: user.id,
          userEmail: user.email,
          status: 'failure',
          errorMessage: 'Account deactivated',
        });
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Your account has been deactivated',
        });
      }

      // 3. Verify password
      if (!user.passwordHash) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      const isValidPassword = await verifyPassword(input.password, user.passwordHash);
      if (!isValidPassword) {
        await logAuth(AuditActions.AUTH_LOGIN_FAILED, ctx, {
          userId: user.id,
          userEmail: user.email,
          status: 'failure',
          errorMessage: 'Invalid password',
        });
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      // 4. Get user's organization (first one they belong to)
      const [membership] = await masterDb
        .select({
          organizationId: organizationMembers.organizationId,
          role: organizationMembers.role,
        })
        .from(organizationMembers)
        .where(eq(organizationMembers.userId, user.id))
        .limit(1);

      const organizationId = membership?.organizationId || null;

      // 5. Check if 2FA is enabled
      if (user.twoFactorEnabled) {
        // Return partial response - client must call twoFactor.verifyLogin
        return {
          requiresTwoFactor: true,
          userId: user.id,
          organizationId,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        };
      }

      // 6. Generate tokens (no 2FA required)
      const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role === 'admin' ? 'admin' : 'member',
        organizationId,
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      // 7. Set refresh token cookie
      setRefreshTokenCookie(ctx.res, refreshToken);

      // 8. Log successful login
      await logAuth(AuditActions.AUTH_LOGIN, ctx, {
        userId: user.id,
        userEmail: user.email,
        organizationId: organizationId ?? undefined,
        description: 'User logged in successfully',
      });

      return {
        requiresTwoFactor: false,
        accessToken,
        expiresIn: 15 * 60, // 15 minutes in seconds
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId,
        },
      };
    }),

  /**
   * Logout - clear refresh token cookie
   */
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    clearRefreshTokenCookie(ctx.res);

    // Log logout
    await logAuth(AuditActions.AUTH_LOGOUT, ctx, {
      description: 'User logged out',
    });

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
    if (!decoded) {
      clearRefreshTokenCookie(ctx.res);
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired refresh token',
      });
    }

    // 2. Verify user still exists and is active
    const masterDb = await getMasterDb();
    const [user] = await masterDb
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user || !user.isActive) {
      clearRefreshTokenCookie(ctx.res);
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not found or deactivated',
      });
    }

    // 3. Generate new access token
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role === 'admin' ? 'admin' : 'member',
      organizationId: decoded.organizationId,
    };

    const accessToken = generateAccessToken(tokenPayload);

    // 4. Optionally rotate refresh token (security best practice)
    const newRefreshToken = generateRefreshToken(tokenPayload);
    setRefreshTokenCookie(ctx.res, newRefreshToken);

    return {
      accessToken,
      expiresIn: 15 * 60,
    };
  }),

  /**
   * Register new user
   */
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(2).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const masterDb = await getMasterDb();

      // 1. Check if email already exists
      const [existingUser] = await masterDb
        .select()
        .from(users)
        .where(eq(users.email, input.email.toLowerCase()))
        .limit(1);

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'An account with this email already exists',
        });
      }

      // 2. Hash password
      const passwordHash = await hashPassword(input.password);

      // 3. Create user
      const result = await masterDb
        .insert(users)
        .values({
          email: input.email.toLowerCase(),
          name: input.name || null,
          passwordHash,
          role: 'member',
          isActive: true,
        })
        .returning();

      const newUser = result[0];
      if (!newUser) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create user',
        });
      }

      return {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
      };
    }),

  /**
   * Switch organization context
   * Used when user belongs to multiple organizations
   */
  switchOrganization: protectedProcedure
    .input(
      z.object({
        organizationId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const masterDb = await getMasterDb();

      // 1. Verify user is member of this organization
      const [membership] = await masterDb
        .select()
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.userId, ctx.user.id),
            eq(organizationMembers.organizationId, input.organizationId)
          )
        )
        .limit(1);

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a member of this organization',
        });
      }

      // 2. Get organization details
      const [org] = await masterDb
        .select()
        .from(organizations)
        .where(eq(organizations.id, input.organizationId))
        .limit(1);

      if (!org || !org.isActive) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found or inactive',
        });
      }

      // 3. Generate new tokens with new organizationId
      const tokenPayload: TokenPayload = {
        userId: ctx.user.id,
        email: ctx.user.email,
        role: ctx.user.role,
        organizationId: input.organizationId,
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);
      setRefreshTokenCookie(ctx.res, refreshToken);

      return {
        accessToken,
        expiresIn: 15 * 60,
        organization: {
          id: org.id,
          name: org.name,
          slug: org.slug,
        },
      };
    }),
});
