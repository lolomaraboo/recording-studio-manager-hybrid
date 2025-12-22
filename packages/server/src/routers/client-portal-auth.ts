import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import {
  clientPortalAccounts,
  clientPortalMagicLinks,
  clientPortalSessions,
  clientPortalActivityLogs,
  clients,
} from "@rsm/database/tenant/schema";
import { getTenantDb } from "@rsm/database/connection";
import { eq, and } from "drizzle-orm";
import {
  generateSecureToken,
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  sanitizeEmail,
  getMagicLinkExpiration,
  getSessionExpiration,
  getPasswordResetExpiration,
  isTokenExpired,
  parseUserAgent,
  generateMagicLinkUrl,
} from "../utils/client-portal-auth";

/**
 * Client Portal Auth Router
 *
 * Handles dual authentication system:
 * - Email/Password login
 * - Magic link (passwordless) login
 * - Email verification
 * - Password reset
 * - Session management
 */
export const clientPortalAuthRouter = router({
  /**
   * Register new client portal account
   * Creates account linked to existing client
   */
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        clientId: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Multi-tenant - Get organizationId from subdomain/slug
      // For now, use org 1 (tenant_1) for testing
      const organizationId = (ctx.req.session as any).organizationId || 1;

      const tenantDb = await getTenantDb(organizationId);
      const email = sanitizeEmail(input.email);

      // Validate password strength
      const passwordValidation = validatePasswordStrength(input.password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join(", "));
      }

      // Check if account already exists
      const existingAccount = await tenantDb
        .select()
        .from(clientPortalAccounts)
        .where(eq(clientPortalAccounts.email, email))
        .limit(1);

      if (existingAccount.length > 0) {
        throw new Error("Email already registered");
      }

      // Verify client exists
      const clientList = await tenantDb
        .select()
        .from(clients)
        .where(eq(clients.id, input.clientId))
        .limit(1);

      if (clientList.length === 0) {
        throw new Error("Client not found");
      }

      // Hash password
      const passwordHash = await hashPassword(input.password);

      // Create account
      const newAccount = await tenantDb
        .insert(clientPortalAccounts)
        .values({
          clientId: input.clientId,
          email,
          passwordHash,
          emailVerified: false, // Require email verification
        })
        .returning();

      // Generate email verification token
      const verificationToken = generateSecureToken();
      await tenantDb.insert(clientPortalMagicLinks).values({
        clientId: input.clientId,
        token: verificationToken,
        expiresAt: getMagicLinkExpiration(),
        purpose: "email_verification",
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
      });

      // TODO: Send verification email
      // const verificationUrl = generateMagicLinkUrl(
      //   verificationToken,
      //   "email_verification",
      //   process.env.CLIENT_PORTAL_URL || "http://localhost:3000"
      // );

      // Log activity
      await tenantDb.insert(clientPortalActivityLogs).values({
        clientId: input.clientId,
        action: "register",
        description: "Client portal account created",
        status: "success",
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
      });

      return {
        accountId: newAccount[0].id,
        email: newAccount[0].email,
        message: "Account created. Please verify your email.",
      };
    }),

  /**
   * Login with email/password
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log('[Client Portal Login] Request:', { email: input.email });

      // TODO: Multi-tenant - Get organizationId from subdomain/slug
      // For now, use org 1 (tenant_1) for testing
      const organizationId = (ctx.req.session as any).organizationId || 1;
      console.log('[Client Portal Login] Using organizationId:', organizationId);

      const tenantDb = await getTenantDb(organizationId);
      const email = sanitizeEmail(input.email);
      console.log('[Client Portal Login] Sanitized email:', email);

      // Find account
      console.log('[Client Portal Login] Querying for account with email:', email);

      // DEBUG: Check which database we're connected to
      const dbCheck = await tenantDb.execute(`SELECT current_database(), current_schema()`);
      console.log('[Client Portal Login] Connected to database:', dbCheck);

      // DEBUG: Check if table exists
      const tableCheck = await tenantDb.execute(
        `SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'client_portal_accounts'`
      );
      console.log('[Client Portal Login] Table exists check:', tableCheck);

      // DEBUG: Count all rows in table
      const countCheck = await tenantDb.execute(`SELECT COUNT(*) FROM client_portal_accounts`);
      console.log('[Client Portal Login] Total rows in table:', countCheck);

      // DEBUG: Try raw SQL first
      const rawResult = await tenantDb.execute(
        `SELECT id, email, client_id FROM client_portal_accounts WHERE email = '${email}' LIMIT 1`
      );
      console.log('[Client Portal Login] Raw SQL result:', rawResult);

      let accountList;
      try {
        accountList = await tenantDb
          .select()
          .from(clientPortalAccounts)
          .where(eq(clientPortalAccounts.email, email))
          .limit(1);
      } catch (err: any) {
        console.error('[Client Portal Login] Query error:', err);
        throw err;
      }

      console.log('[Client Portal Login] Drizzle query result:', accountList.length);
      if (accountList.length > 0) {
        console.log('[Client Portal Login] Account found:', {
          id: accountList[0].id,
          email: accountList[0].email,
          clientId: accountList[0].clientId
        });
      }

      if (accountList.length === 0) {
        throw new Error("Invalid credentials");
      }

      const account = accountList[0];

      // Check if account is active
      if (!account.isActive) {
        throw new Error("Account is disabled");
      }

      if (account.isLocked) {
        throw new Error(
          `Account is locked${account.lockedReason ? `: ${account.lockedReason}` : ""}`
        );
      }

      // Check password
      if (!account.passwordHash) {
        throw new Error("Password login not available. Please use magic link.");
      }

      const isValid = await verifyPassword(input.password, account.passwordHash);
      if (!isValid) {
        // Log failed login
        await tenantDb.insert(clientPortalActivityLogs).values({
          clientId: account.clientId,
          action: "login",
          description: "Failed login attempt (invalid password)",
          status: "failed",
          ipAddress: ctx.req.ip,
          userAgent: ctx.req.headers["user-agent"],
        });

        throw new Error("Invalid credentials");
      }

      // Check email verification
      if (!account.emailVerified) {
        throw new Error("Please verify your email before logging in");
      }

      // Create session
      const sessionToken = generateSecureToken();
      const deviceInfo = parseUserAgent(ctx.req.headers["user-agent"]);

      await tenantDb.insert(clientPortalSessions).values({
        clientId: account.clientId,
        token: sessionToken,
        expiresAt: getSessionExpiration(),
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
      });

      // Update last login
      await tenantDb
        .update(clientPortalAccounts)
        .set({
          lastLoginAt: new Date(),
          loginCount: account.loginCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(clientPortalAccounts.id, account.id));

      // Log successful login
      await tenantDb.insert(clientPortalActivityLogs).values({
        clientId: account.clientId,
        action: "login",
        description: "Successful login with password",
        status: "success",
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
      });

      // Get client details
      const client = await tenantDb
        .select()
        .from(clients)
        .where(eq(clients.id, account.clientId))
        .limit(1);

      return {
        sessionToken,
        expiresAt: getSessionExpiration(),
        client: client[0],
      };
    }),

  /**
   * Request magic link
   * Sends a magic link to the client's email for passwordless login
   */
  requestMagicLink: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = (ctx.req.session as any).organizationId;
      if (!organizationId) {
        throw new Error("Not authenticated");
      }

      const tenantDb = await getTenantDb(organizationId);
      const email = sanitizeEmail(input.email);

      // Find account
      const accountList = await tenantDb
        .select()
        .from(clientPortalAccounts)
        .where(eq(clientPortalAccounts.email, email))
        .limit(1);

      if (accountList.length === 0) {
        // Don't reveal if account exists (security best practice)
        return {
          message:
            "If an account exists with this email, a magic link has been sent.",
        };
      }

      const account = accountList[0];

      // Check if account is active
      if (!account.isActive || account.isLocked) {
        return {
          message:
            "If an account exists with this email, a magic link has been sent.",
        };
      }

      // Generate magic link token
      const token = generateSecureToken();
      await tenantDb.insert(clientPortalMagicLinks).values({
        clientId: account.clientId,
        token,
        expiresAt: getMagicLinkExpiration(),
        purpose: "login",
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
      });

      // TODO: Send magic link email
      // const magicLinkUrl = generateMagicLinkUrl(
      //   token,
      //   "login",
      //   process.env.CLIENT_PORTAL_URL || "http://localhost:3000"
      // );

      // Log activity
      await tenantDb.insert(clientPortalActivityLogs).values({
        clientId: account.clientId,
        action: "magic_link_request",
        description: "Magic link requested",
        status: "success",
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
      });

      return {
        message:
          "If an account exists with this email, a magic link has been sent.",
      };
    }),

  /**
   * Verify magic link token
   * Exchanges a magic link token for a session
   */
  verifyMagicLink: publicProcedure
    .input(
      z.object({
        token: z.string().length(64), // 32 bytes * 2 (hex)
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = (ctx.req.session as any).organizationId;
      if (!organizationId) {
        throw new Error("Not authenticated");
      }

      const tenantDb = await getTenantDb(organizationId);

      // Find magic link
      const magicLinkList = await tenantDb
        .select()
        .from(clientPortalMagicLinks)
        .where(eq(clientPortalMagicLinks.token, input.token))
        .limit(1);

      if (magicLinkList.length === 0) {
        throw new Error("Invalid or expired magic link");
      }

      const magicLink = magicLinkList[0];

      // Check if already used
      if (magicLink.usedAt) {
        throw new Error("Magic link has already been used");
      }

      // Check expiration
      if (isTokenExpired(magicLink.expiresAt)) {
        throw new Error("Magic link has expired");
      }

      // Mark as used
      await tenantDb
        .update(clientPortalMagicLinks)
        .set({ usedAt: new Date() })
        .where(eq(clientPortalMagicLinks.id, magicLink.id));

      // Handle different purposes
      if (magicLink.purpose === "email_verification") {
        // Verify email
        await tenantDb
          .update(clientPortalAccounts)
          .set({
            emailVerified: true,
            emailVerifiedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(clientPortalAccounts.clientId, magicLink.clientId));

        // Log activity
        await tenantDb.insert(clientPortalActivityLogs).values({
          clientId: magicLink.clientId,
          action: "email_verified",
          description: "Email verified successfully",
          status: "success",
          ipAddress: ctx.req.ip,
          userAgent: ctx.req.headers["user-agent"],
        });

        return {
          purpose: "email_verification",
          message: "Email verified successfully. You can now log in.",
        };
      }

      // For login magic links, create session
      const sessionToken = generateSecureToken();
      const deviceInfo = parseUserAgent(ctx.req.headers["user-agent"]);

      await tenantDb.insert(clientPortalSessions).values({
        clientId: magicLink.clientId,
        token: sessionToken,
        expiresAt: getSessionExpiration(),
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
      });

      // Update last login
      const account = await tenantDb
        .select()
        .from(clientPortalAccounts)
        .where(eq(clientPortalAccounts.clientId, magicLink.clientId))
        .limit(1);

      if (account.length > 0) {
        await tenantDb
          .update(clientPortalAccounts)
          .set({
            lastLoginAt: new Date(),
            loginCount: account[0].loginCount + 1,
            updatedAt: new Date(),
          })
          .where(eq(clientPortalAccounts.id, account[0].id));
      }

      // Log successful login
      await tenantDb.insert(clientPortalActivityLogs).values({
        clientId: magicLink.clientId,
        action: "login",
        description: "Successful login with magic link",
        status: "success",
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
      });

      // Get client details
      const client = await tenantDb
        .select()
        .from(clients)
        .where(eq(clients.id, magicLink.clientId))
        .limit(1);

      return {
        purpose: "login",
        sessionToken,
        expiresAt: getSessionExpiration(),
        client: client[0],
      };
    }),

  /**
   * Request password reset
   */
  requestPasswordReset: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = (ctx.req.session as any).organizationId;
      if (!organizationId) {
        throw new Error("Not authenticated");
      }

      const tenantDb = await getTenantDb(organizationId);
      const email = sanitizeEmail(input.email);

      // Find account
      const accountList = await tenantDb
        .select()
        .from(clientPortalAccounts)
        .where(eq(clientPortalAccounts.email, email))
        .limit(1);

      if (accountList.length === 0) {
        // Don't reveal if account exists
        return {
          message:
            "If an account exists with this email, a password reset link has been sent.",
        };
      }

      const account = accountList[0];

      // Check if account is active
      if (!account.isActive || account.isLocked) {
        return {
          message:
            "If an account exists with this email, a password reset link has been sent.",
        };
      }

      // Generate reset token
      const resetToken = generateSecureToken();

      // Update account with reset token
      await tenantDb
        .update(clientPortalAccounts)
        .set({
          resetToken,
          resetTokenExpiresAt: getPasswordResetExpiration(),
          updatedAt: new Date(),
        })
        .where(eq(clientPortalAccounts.id, account.id));

      // Also create a magic link for the password reset flow
      await tenantDb.insert(clientPortalMagicLinks).values({
        clientId: account.clientId,
        token: resetToken,
        expiresAt: getPasswordResetExpiration(),
        purpose: "password_reset",
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
      });

      // TODO: Send password reset email
      // const resetUrl = generateMagicLinkUrl(
      //   resetToken,
      //   "password_reset",
      //   process.env.CLIENT_PORTAL_URL || "http://localhost:3000"
      // );

      // Log activity
      await tenantDb.insert(clientPortalActivityLogs).values({
        clientId: account.clientId,
        action: "password_reset_request",
        description: "Password reset requested",
        status: "success",
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
      });

      return {
        message:
          "If an account exists with this email, a password reset link has been sent.",
      };
    }),

  /**
   * Reset password with token
   */
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string().length(64),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = (ctx.req.session as any).organizationId;
      if (!organizationId) {
        throw new Error("Not authenticated");
      }

      const tenantDb = await getTenantDb(organizationId);

      // Validate password strength
      const passwordValidation = validatePasswordStrength(input.newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join(", "));
      }

      // Find account with reset token
      const accountList = await tenantDb
        .select()
        .from(clientPortalAccounts)
        .where(eq(clientPortalAccounts.resetToken, input.token))
        .limit(1);

      if (accountList.length === 0) {
        throw new Error("Invalid or expired reset token");
      }

      const account = accountList[0];

      // Check token expiration
      if (
        !account.resetTokenExpiresAt ||
        isTokenExpired(account.resetTokenExpiresAt)
      ) {
        throw new Error("Reset token has expired");
      }

      // Hash new password
      const passwordHash = await hashPassword(input.newPassword);

      // Update password and clear reset token
      await tenantDb
        .update(clientPortalAccounts)
        .set({
          passwordHash,
          resetToken: null,
          resetTokenExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(clientPortalAccounts.id, account.id));

      // Mark magic link as used
      await tenantDb
        .update(clientPortalMagicLinks)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(clientPortalMagicLinks.token, input.token),
            eq(clientPortalMagicLinks.purpose, "password_reset")
          )
        );

      // Log activity
      await tenantDb.insert(clientPortalActivityLogs).values({
        clientId: account.clientId,
        action: "password_reset",
        description: "Password reset successfully",
        status: "success",
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
      });

      return {
        message: "Password reset successfully. You can now log in.",
      };
    }),

  /**
   * Logout
   * Destroys the current session
   */
  logout: publicProcedure
    .input(
      z.object({
        sessionToken: z.string().length(64),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = (ctx.req.session as any).organizationId;
      if (!organizationId) {
        throw new Error("Not authenticated");
      }

      const tenantDb = await getTenantDb(organizationId);

      // Find and delete session
      const sessionList = await tenantDb
        .select()
        .from(clientPortalSessions)
        .where(eq(clientPortalSessions.token, input.sessionToken))
        .limit(1);

      if (sessionList.length > 0) {
        const session = sessionList[0];

        // Delete session
        await tenantDb
          .delete(clientPortalSessions)
          .where(eq(clientPortalSessions.id, session.id));

        // Log activity
        await tenantDb.insert(clientPortalActivityLogs).values({
          clientId: session.clientId,
          action: "logout",
          description: "Logged out successfully",
          status: "success",
          ipAddress: ctx.req.ip,
          userAgent: ctx.req.headers["user-agent"],
        });
      }

      return { message: "Logged out successfully" };
    }),

  /**
   * Get current session
   * Validates and returns current client session
   */
  getCurrentSession: publicProcedure
    .input(
      z.object({
        sessionToken: z.string().length(64),
      })
    )
    .query(async ({ ctx, input }) => {
      const organizationId = (ctx.req.session as any).organizationId;
      if (!organizationId) {
        throw new Error("Not authenticated");
      }

      const tenantDb = await getTenantDb(organizationId);

      // Find session
      const sessionList = await tenantDb
        .select()
        .from(clientPortalSessions)
        .where(eq(clientPortalSessions.token, input.sessionToken))
        .limit(1);

      if (sessionList.length === 0) {
        throw new Error("Invalid session");
      }

      const session = sessionList[0];

      // Check expiration
      if (isTokenExpired(session.expiresAt)) {
        // Delete expired session
        await tenantDb
          .delete(clientPortalSessions)
          .where(eq(clientPortalSessions.id, session.id));

        throw new Error("Session expired");
      }

      // Update last activity
      await tenantDb
        .update(clientPortalSessions)
        .set({ lastActivityAt: new Date() })
        .where(eq(clientPortalSessions.id, session.id));

      // Get client details
      const client = await tenantDb
        .select()
        .from(clients)
        .where(eq(clients.id, session.clientId))
        .limit(1);

      if (client.length === 0) {
        throw new Error("Client not found");
      }

      return {
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
          lastActivityAt: session.lastActivityAt,
          deviceType: session.deviceType,
          browser: session.browser,
          os: session.os,
        },
        client: client[0],
      };
    }),
});
