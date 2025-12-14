/**
 * Two-Factor Authentication Router
 *
 * Endpoints:
 * - setup: Generate QR code and backup codes for 2FA setup
 * - verify: Verify TOTP token and enable 2FA
 * - disable: Disable 2FA for user
 * - verifyLogin: Verify 2FA token during login (called after password check)
 * - verifyBackupCode: Use backup code when authenticator unavailable
 * - regenerateBackupCodes: Generate new backup codes
 * - status: Get 2FA status for current user
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { getMasterDb } from '@rsm/database/connection';
import { users } from '@rsm/database/master';
import {
  generateSetupData,
  verifyToken,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
  encryptSecret,
  decryptSecret,
  formatBackupCode,
  parseBackupCode,
} from '../_core/twoFactor';
import {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
  type TokenPayload,
} from '../_core/auth';

export const twoFactorRouter = router({
  /**
   * Get 2FA status for current user
   */
  status: protectedProcedure.query(async ({ ctx }) => {
    const masterDb = await getMasterDb();

    const [user] = await masterDb
      .select({
        twoFactorEnabled: users.twoFactorEnabled,
        twoFactorVerifiedAt: users.twoFactorVerifiedAt,
      })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    return {
      enabled: user?.twoFactorEnabled || false,
      verifiedAt: user?.twoFactorVerifiedAt || null,
    };
  }),

  /**
   * Generate 2FA setup data (QR code + backup codes)
   * Must be verified before 2FA is actually enabled
   */
  setup: protectedProcedure.mutation(async ({ ctx }) => {
    const masterDb = await getMasterDb();

    // Check if 2FA is already enabled
    const [user] = await masterDb
      .select({
        email: users.email,
        twoFactorEnabled: users.twoFactorEnabled,
      })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    if (user.twoFactorEnabled) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: '2FA is already enabled. Disable it first to reconfigure.',
      });
    }

    // Generate setup data
    const setupData = await generateSetupData(user.email, 'RSM Studio');

    // Encrypt and store secret temporarily (not enabled yet)
    const encryptedSecret = encryptSecret(setupData.secret);
    const hashedBackupCodes = setupData.backupCodes.map(hashBackupCode);

    await masterDb
      .update(users)
      .set({
        twoFactorSecret: encryptedSecret,
        twoFactorBackupCodes: JSON.stringify(hashedBackupCodes),
        updatedAt: new Date(),
      })
      .where(eq(users.id, ctx.user.id));

    // Return setup data to user (formatted backup codes for display)
    return {
      qrCode: setupData.qrCode,
      secret: setupData.secret, // User can manually enter this
      backupCodes: setupData.backupCodes.map(formatBackupCode),
      otpauthUri: setupData.otpauthUri,
    };
  }),

  /**
   * Verify TOTP token and enable 2FA
   * User must provide a valid token to confirm they've set up their authenticator
   */
  verify: protectedProcedure
    .input(
      z.object({
        token: z.string().length(6),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const masterDb = await getMasterDb();

      const [user] = await masterDb
        .select({
          twoFactorSecret: users.twoFactorSecret,
          twoFactorEnabled: users.twoFactorEnabled,
        })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      if (user.twoFactorEnabled) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '2FA is already enabled',
        });
      }

      if (!user.twoFactorSecret) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No 2FA setup in progress. Call setup first.',
        });
      }

      // Decrypt and verify token
      const secret = decryptSecret(user.twoFactorSecret);
      const isValid = verifyToken(input.token, secret);

      if (!isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid verification code. Please try again.',
        });
      }

      // Enable 2FA
      await masterDb
        .update(users)
        .set({
          twoFactorEnabled: true,
          twoFactorVerifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
        message: '2FA has been successfully enabled',
      };
    }),

  /**
   * Disable 2FA for user
   * Requires current TOTP token or backup code
   */
  disable: protectedProcedure
    .input(
      z.object({
        token: z.string().min(6),
        type: z.enum(['totp', 'backup']).default('totp'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const masterDb = await getMasterDb();

      const [user] = await masterDb
        .select({
          twoFactorSecret: users.twoFactorSecret,
          twoFactorEnabled: users.twoFactorEnabled,
          twoFactorBackupCodes: users.twoFactorBackupCodes,
        })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      if (!user.twoFactorEnabled) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '2FA is not enabled',
        });
      }

      let isValid = false;

      if (input.type === 'totp') {
        // Verify TOTP token
        const secret = decryptSecret(user.twoFactorSecret!);
        isValid = verifyToken(input.token, secret);
      } else {
        // Verify backup code
        const hashedCodes = JSON.parse(user.twoFactorBackupCodes || '[]') as string[];
        const codeIndex = verifyBackupCode(parseBackupCode(input.token), hashedCodes);
        isValid = codeIndex >= 0;
      }

      if (!isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid verification code',
        });
      }

      // Disable 2FA and clear all related data
      await masterDb
        .update(users)
        .set({
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorBackupCodes: null,
          twoFactorVerifiedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
        message: '2FA has been disabled',
      };
    }),

  /**
   * Verify 2FA during login
   * Called after password verification when 2FA is enabled
   */
  verifyLogin: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        token: z.string().length(6),
        organizationId: z.number().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const masterDb = await getMasterDb();

      const [user] = await masterDb
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      if (!user.twoFactorEnabled || !user.twoFactorSecret) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '2FA is not enabled for this user',
        });
      }

      // Verify token
      const secret = decryptSecret(user.twoFactorSecret);
      const isValid = verifyToken(input.token, secret);

      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid verification code',
        });
      }

      // Generate full access tokens
      const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role === 'admin' ? 'admin' : 'member',
        organizationId: input.organizationId,
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);
      setRefreshTokenCookie(ctx.res, refreshToken);

      return {
        accessToken,
        expiresIn: 15 * 60,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: input.organizationId,
        },
      };
    }),

  /**
   * Verify backup code during login
   */
  verifyBackupCode: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        code: z.string().min(8),
        organizationId: z.number().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const masterDb = await getMasterDb();

      const [user] = await masterDb
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      if (!user.twoFactorEnabled) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '2FA is not enabled for this user',
        });
      }

      // Verify backup code
      const hashedCodes = JSON.parse(user.twoFactorBackupCodes || '[]') as string[];
      const codeIndex = verifyBackupCode(parseBackupCode(input.code), hashedCodes);

      if (codeIndex === -1) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid backup code',
        });
      }

      // Remove used backup code
      hashedCodes.splice(codeIndex, 1);
      await masterDb
        .update(users)
        .set({
          twoFactorBackupCodes: JSON.stringify(hashedCodes),
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId));

      // Generate tokens
      const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role === 'admin' ? 'admin' : 'member',
        organizationId: input.organizationId,
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);
      setRefreshTokenCookie(ctx.res, refreshToken);

      return {
        accessToken,
        expiresIn: 15 * 60,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: input.organizationId,
        },
        remainingBackupCodes: hashedCodes.length,
      };
    }),

  /**
   * Regenerate backup codes
   */
  regenerateBackupCodes: protectedProcedure
    .input(
      z.object({
        token: z.string().length(6),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const masterDb = await getMasterDb();

      const [user] = await masterDb
        .select({
          twoFactorSecret: users.twoFactorSecret,
          twoFactorEnabled: users.twoFactorEnabled,
        })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      if (!user.twoFactorEnabled) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '2FA is not enabled',
        });
      }

      // Verify current token
      const secret = decryptSecret(user.twoFactorSecret!);
      const isValid = verifyToken(input.token, secret);

      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid verification code',
        });
      }

      // Generate new backup codes
      const newCodes = generateBackupCodes(10);
      const hashedCodes = newCodes.map(hashBackupCode);

      await masterDb
        .update(users)
        .set({
          twoFactorBackupCodes: JSON.stringify(hashedCodes),
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
        backupCodes: newCodes.map(formatBackupCode),
      };
    }),
});
