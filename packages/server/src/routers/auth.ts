import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { users, organizations, tenantDatabases, organizationMembers } from "@rsm/database/master/schema";
import { getMasterDb } from "@rsm/database/connection";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createTenantDatabase } from "../services/tenant-provisioning";

/**
 * Auth Router
 * Real authentication with bcrypt + sessions
 */
export const authRouter = router({
  /**
   * Register new user + organization
   */
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(1),
        organizationName: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const masterDb = await getMasterDb();

      // Check if user exists
      const existingUser = await masterDb
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new Error("User already exists");
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 10);

      // Create user
      const newUser = await masterDb
        .insert(users)
        .values({
          email: input.email,
          passwordHash,
          name: input.name,
          role: "admin",
        })
        .returning();

      const userId = newUser[0].id;

      // Create organization
      const slug = input.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const newOrg = await masterDb
        .insert(organizations)
        .values({
          name: input.organizationName,
          slug,
          subdomain: slug,
          ownerId: userId,
        })
        .returning();

      const orgId = newOrg[0].id;

      // Create tenant database (physical DB + migrations + registry)
      const tenantCreationResult = await createTenantDatabase(orgId);

      if (!tenantCreationResult.success) {
        throw new Error(`Failed to create tenant database: ${tenantCreationResult.error}`);
      }

      console.log(`[Register] Tenant database created successfully for org ${orgId}`);

      // Set session and save it to Redis
      (ctx.req.session as any).userId = userId;
      (ctx.req.session as any).organizationId = orgId;
      (ctx.req.session as any).email = input.email;
      (ctx.req.session as any).name = input.name;
      (ctx.req.session as any).role = "admin";

      // Explicitly save session to ensure it's written to Redis
      await new Promise<void>((resolve, reject) => {
        ctx.req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log('[Register] Session saved to Redis');

      return {
        user: {
          id: userId,
          email: input.email,
          name: input.name,
          role: "admin",
        },
        organization: {
          id: orgId,
          name: input.organizationName,
        },
      };
    }),

  /**
   * Login user
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const masterDb = await getMasterDb();

      // Find user
      const userList = await masterDb
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (userList.length === 0) {
        throw new Error("Invalid credentials");
      }

      const user = userList[0];

      // Check password
      if (!user.passwordHash) {
        throw new Error("Invalid credentials");
      }

      const isValid = await bcrypt.compare(input.password, user.passwordHash);
      if (!isValid) {
        throw new Error("Invalid credentials");
      }

      // Find organization - try owner first, then membership
      let orgList = await masterDb
        .select()
        .from(organizations)
        .where(eq(organizations.ownerId, user.id))
        .limit(1);

      // If not owner, try membership
      if (orgList.length === 0) {
        const membershipList = await masterDb
          .select({
            id: organizations.id,
            name: organizations.name,
            ownerId: organizations.ownerId,
            subdomain: organizations.subdomain,
            createdAt: organizations.createdAt,
            updatedAt: organizations.updatedAt,
          })
          .from(organizationMembers)
          .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
          .where(eq(organizationMembers.userId, user.id))
          .limit(1);

        if (membershipList.length === 0) {
          throw new Error("No organization found - user must be owner or member of an organization");
        }

        orgList = membershipList;
      }

      const org = orgList[0];

      // Set session and save it to Redis
      (ctx.req.session as any).userId = user.id;
      (ctx.req.session as any).organizationId = org.id;
      (ctx.req.session as any).email = user.email;
      (ctx.req.session as any).name = user.name;
      (ctx.req.session as any).role = user.role;

      // Explicitly save session to ensure it's written to Redis
      await new Promise<void>((resolve, reject) => {
        ctx.req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log('[Login] Session saved to Redis');

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name || null,
          role: user.role!,
        },
        organization: {
          id: org.id!,
          name: org.name!,
        },
      };
    }),

  /**
   * Get current user
   */
  me: publicProcedure.query(async ({ ctx }) => {
    const session = ctx.req.session as any;

    if (!session.userId || !session.organizationId) {
      return null;
    }

    const masterDb = await getMasterDb();

    // Get user
    const userList = await masterDb
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (userList.length === 0) {
      return null;
    }

    const user = userList[0];

    // Get organization
    const orgList = await masterDb
      .select()
      .from(organizations)
      .where(eq(organizations.id, session.organizationId))
      .limit(1);

    if (orgList.length === 0) {
      return null;
    }

    const org = orgList[0];

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || null,
        role: user.role!,
      },
      organization: {
        id: org.id!,
        name: org.name!,
      },
    };
  }),

  /**
   * Logout user
   */
  logout: publicProcedure.mutation(async ({ ctx }) => {
    return new Promise<void>((resolve, reject) => {
      ctx.req.session.destroy((err) => {
        if (err) {
          reject(new Error("Logout failed"));
        } else {
          ctx.res.clearCookie("connect.sid");
          resolve();
        }
      });
    });
  }),
});
