import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import {
  clients,
  sessions,
  invoices,
  invoiceItems,
  projects,
  tracks,
  clientPortalSessions,
  clientPortalActivityLogs,
} from "@rsm/database/tenant/schema";
import { getTenantDb } from "@rsm/database/connection";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { isTokenExpired } from "../utils/client-portal-auth";

/**
 * Middleware helper to validate client portal session
 * Extracts clientId from session token
 */
async function validateClientSession(
  organizationId: number,
  sessionToken: string
): Promise<number> {
  const tenantDb = await getTenantDb(organizationId);

  // Find session
  const sessionList = await tenantDb
    .select()
    .from(clientPortalSessions)
    .where(eq(clientPortalSessions.token, sessionToken))
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

  return session.clientId;
}

/**
 * Client Portal Dashboard Router
 *
 * Provides read-only access to client data:
 * - Client profile
 * - Recording sessions
 * - Invoices and payments
 * - Projects and tracks
 * - Activity logs
 */
export const clientPortalDashboardRouter = router({
  /**
   * Get client profile
   */
  getProfile: publicProcedure
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

      const clientId = await validateClientSession(
        organizationId,
        input.sessionToken
      );
      const tenantDb = await getTenantDb(organizationId);

      // Get client details
      const clientList = await tenantDb
        .select()
        .from(clients)
        .where(eq(clients.id, clientId))
        .limit(1);

      if (clientList.length === 0) {
        throw new Error("Client not found");
      }

      const client = clientList[0];

      // Get statistics
      const [sessionsCount, invoicesCount, projectsCount] = await Promise.all([
        tenantDb
          .select({ count: sql<number>`count(*)` })
          .from(sessions)
          .where(eq(sessions.clientId, clientId)),
        tenantDb
          .select({ count: sql<number>`count(*)` })
          .from(invoices)
          .where(eq(invoices.clientId, clientId)),
        tenantDb
          .select({ count: sql<number>`count(*)` })
          .from(projects)
          .where(eq(projects.clientId, clientId)),
      ]);

      // Log activity
      await tenantDb.insert(clientPortalActivityLogs).values({
        clientId,
        action: "view_profile",
        description: "Viewed profile",
        status: "success",
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
      });

      return {
        client,
        stats: {
          totalSessions: Number(sessionsCount[0]?.count || 0),
          totalInvoices: Number(invoicesCount[0]?.count || 0),
          totalProjects: Number(projectsCount[0]?.count || 0),
        },
      };
    }),

  /**
   * List client's recording sessions
   */
  listSessions: publicProcedure
    .input(
      z.object({
        sessionToken: z.string().length(64),
        limit: z.number().int().positive().default(20),
        offset: z.number().int().nonnegative().default(0),
        status: z.enum(["upcoming", "in_progress", "completed", "cancelled"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const organizationId = (ctx.req.session as any).organizationId;
      if (!organizationId) {
        throw new Error("Not authenticated");
      }

      const clientId = await validateClientSession(
        organizationId,
        input.sessionToken
      );
      const tenantDb = await getTenantDb(organizationId);

      // Build query
      let query = tenantDb
        .select()
        .from(sessions)
        .where(eq(sessions.clientId, clientId))
        .orderBy(desc(sessions.startTime))
        .limit(input.limit)
        .offset(input.offset);

      // Apply status filter if provided
      if (input.status) {
        query = tenantDb
          .select()
          .from(sessions)
          .where(
            and(eq(sessions.clientId, clientId), eq(sessions.status, input.status))
          )
          .orderBy(desc(sessions.startTime))
          .limit(input.limit)
          .offset(input.offset);
      }

      const sessionsList = await query;

      // Get total count
      const countQuery = input.status
        ? tenantDb
            .select({ count: sql<number>`count(*)` })
            .from(sessions)
            .where(
              and(eq(sessions.clientId, clientId), eq(sessions.status, input.status))
            )
        : tenantDb
            .select({ count: sql<number>`count(*)` })
            .from(sessions)
            .where(eq(sessions.clientId, clientId));

      const totalCount = await countQuery;

      // Log activity
      await tenantDb.insert(clientPortalActivityLogs).values({
        clientId,
        action: "view_sessions",
        description: `Viewed sessions list${input.status ? ` (status: ${input.status})` : ""}`,
        status: "success",
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
      });

      return {
        sessions: sessionsList,
        total: Number(totalCount[0]?.count || 0),
        limit: input.limit,
        offset: input.offset,
      };
    }),

  /**
   * Get session details
   */
  getSession: publicProcedure
    .input(
      z.object({
        sessionToken: z.string().length(64),
        sessionId: z.number().int().positive(),
      })
    )
    .query(async ({ ctx, input }) => {
      const organizationId = (ctx.req.session as any).organizationId;
      if (!organizationId) {
        throw new Error("Not authenticated");
      }

      const clientId = await validateClientSession(
        organizationId,
        input.sessionToken
      );
      const tenantDb = await getTenantDb(organizationId);

      // Get session (verify ownership)
      const sessionList = await tenantDb
        .select()
        .from(sessions)
        .where(
          and(eq(sessions.id, input.sessionId), eq(sessions.clientId, clientId))
        )
        .limit(1);

      if (sessionList.length === 0) {
        throw new Error("Session not found or access denied");
      }

      // Log activity
      await tenantDb.insert(clientPortalActivityLogs).values({
        clientId,
        action: "view_session",
        description: `Viewed session #${input.sessionId}`,
        resourceType: "session",
        resourceId: input.sessionId,
        status: "success",
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
      });

      return sessionList[0];
    }),

  /**
   * List client's invoices
   */
  listInvoices: publicProcedure
    .input(
      z.object({
        sessionToken: z.string().length(64),
        limit: z.number().int().positive().default(20),
        offset: z.number().int().nonnegative().default(0),
        status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const organizationId = (ctx.req.session as any).organizationId;
      if (!organizationId) {
        throw new Error("Not authenticated");
      }

      const clientId = await validateClientSession(
        organizationId,
        input.sessionToken
      );
      const tenantDb = await getTenantDb(organizationId);

      // Build query
      let query = tenantDb
        .select()
        .from(invoices)
        .where(eq(invoices.clientId, clientId))
        .orderBy(desc(invoices.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Apply status filter if provided
      if (input.status) {
        query = tenantDb
          .select()
          .from(invoices)
          .where(
            and(eq(invoices.clientId, clientId), eq(invoices.status, input.status))
          )
          .orderBy(desc(invoices.createdAt))
          .limit(input.limit)
          .offset(input.offset);
      }

      const invoicesList = await query;

      // Get total count
      const countQuery = input.status
        ? tenantDb
            .select({ count: sql<number>`count(*)` })
            .from(invoices)
            .where(
              and(eq(invoices.clientId, clientId), eq(invoices.status, input.status))
            )
        : tenantDb
            .select({ count: sql<number>`count(*)` })
            .from(invoices)
            .where(eq(invoices.clientId, clientId));

      const totalCount = await countQuery;

      // Log activity
      await tenantDb.insert(clientPortalActivityLogs).values({
        clientId,
        action: "view_invoices",
        description: `Viewed invoices list${input.status ? ` (status: ${input.status})` : ""}`,
        status: "success",
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
      });

      return {
        invoices: invoicesList,
        total: Number(totalCount[0]?.count || 0),
        limit: input.limit,
        offset: input.offset,
      };
    }),

  /**
   * Get invoice details with items
   */
  getInvoice: publicProcedure
    .input(
      z.object({
        sessionToken: z.string().length(64),
        invoiceId: z.number().int().positive(),
      })
    )
    .query(async ({ ctx, input }) => {
      const organizationId = (ctx.req.session as any).organizationId;
      if (!organizationId) {
        throw new Error("Not authenticated");
      }

      const clientId = await validateClientSession(
        organizationId,
        input.sessionToken
      );
      const tenantDb = await getTenantDb(organizationId);

      // Get invoice (verify ownership)
      const invoiceList = await tenantDb
        .select()
        .from(invoices)
        .where(
          and(eq(invoices.id, input.invoiceId), eq(invoices.clientId, clientId))
        )
        .limit(1);

      if (invoiceList.length === 0) {
        throw new Error("Invoice not found or access denied");
      }

      const invoice = invoiceList[0];

      // Get invoice items
      const items = await tenantDb
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, input.invoiceId))
        .orderBy(invoiceItems.id);

      // Log activity
      await tenantDb.insert(clientPortalActivityLogs).values({
        clientId,
        action: "view_invoice",
        description: `Viewed invoice #${invoice.invoiceNumber || input.invoiceId}`,
        resourceType: "invoice",
        resourceId: input.invoiceId,
        status: "success",
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
      });

      return {
        invoice,
        items,
      };
    }),

  /**
   * Download invoice PDF
   * TODO: Implement PDF generation
   */
  downloadInvoice: publicProcedure
    .input(
      z.object({
        sessionToken: z.string().length(64),
        invoiceId: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = (ctx.req.session as any).organizationId;
      if (!organizationId) {
        throw new Error("Not authenticated");
      }

      const clientId = await validateClientSession(
        organizationId,
        input.sessionToken
      );
      const tenantDb = await getTenantDb(organizationId);

      // Verify invoice ownership
      const invoiceList = await tenantDb
        .select()
        .from(invoices)
        .where(
          and(eq(invoices.id, input.invoiceId), eq(invoices.clientId, clientId))
        )
        .limit(1);

      if (invoiceList.length === 0) {
        throw new Error("Invoice not found or access denied");
      }

      // Log activity
      await tenantDb.insert(clientPortalActivityLogs).values({
        clientId,
        action: "download_invoice",
        description: `Downloaded invoice #${invoiceList[0].invoiceNumber || input.invoiceId}`,
        resourceType: "invoice",
        resourceId: input.invoiceId,
        status: "success",
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
      });

      // TODO: Generate and return PDF
      return {
        message: "PDF generation not yet implemented",
        invoiceNumber: invoiceList[0].invoiceNumber,
      };
    }),

  /**
   * List client's projects
   */
  listProjects: publicProcedure
    .input(
      z.object({
        sessionToken: z.string().length(64),
        limit: z.number().int().positive().default(20),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const organizationId = (ctx.req.session as any).organizationId;
      if (!organizationId) {
        throw new Error("Not authenticated");
      }

      const clientId = await validateClientSession(
        organizationId,
        input.sessionToken
      );
      const tenantDb = await getTenantDb(organizationId);

      // Get projects
      const projectsList = await tenantDb
        .select()
        .from(projects)
        .where(eq(projects.clientId, clientId))
        .orderBy(desc(projects.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Get total count
      const totalCount = await tenantDb
        .select({ count: sql<number>`count(*)` })
        .from(projects)
        .where(eq(projects.clientId, clientId));

      // Log activity
      await tenantDb.insert(clientPortalActivityLogs).values({
        clientId,
        action: "view_projects",
        description: "Viewed projects list",
        status: "success",
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
      });

      return {
        projects: projectsList,
        total: Number(totalCount[0]?.count || 0),
        limit: input.limit,
        offset: input.offset,
      };
    }),

  /**
   * Get project details with tracks
   */
  getProject: publicProcedure
    .input(
      z.object({
        sessionToken: z.string().length(64),
        projectId: z.number().int().positive(),
      })
    )
    .query(async ({ ctx, input }) => {
      const organizationId = (ctx.req.session as any).organizationId;
      if (!organizationId) {
        throw new Error("Not authenticated");
      }

      const clientId = await validateClientSession(
        organizationId,
        input.sessionToken
      );
      const tenantDb = await getTenantDb(organizationId);

      // Get project (verify ownership)
      const projectList = await tenantDb
        .select()
        .from(projects)
        .where(
          and(eq(projects.id, input.projectId), eq(projects.clientId, clientId))
        )
        .limit(1);

      if (projectList.length === 0) {
        throw new Error("Project not found or access denied");
      }

      const project = projectList[0];

      // Get tracks for this project
      const tracksList = await tenantDb
        .select()
        .from(tracks)
        .where(eq(tracks.projectId, input.projectId))
        .orderBy(tracks.trackNumber);

      // Log activity
      await tenantDb.insert(clientPortalActivityLogs).values({
        clientId,
        action: "view_project",
        description: `Viewed project "${project.title}"`,
        resourceType: "project",
        resourceId: input.projectId,
        status: "success",
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
      });

      return {
        project,
        tracks: tracksList,
      };
    }),

  /**
   * Get activity logs
   */
  getActivityLogs: publicProcedure
    .input(
      z.object({
        sessionToken: z.string().length(64),
        limit: z.number().int().positive().default(50),
        offset: z.number().int().nonnegative().default(0),
        fromDate: z.string().datetime().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const organizationId = (ctx.req.session as any).organizationId;
      if (!organizationId) {
        throw new Error("Not authenticated");
      }

      const clientId = await validateClientSession(
        organizationId,
        input.sessionToken
      );
      const tenantDb = await getTenantDb(organizationId);

      // Build query
      let query = tenantDb
        .select()
        .from(clientPortalActivityLogs)
        .where(eq(clientPortalActivityLogs.clientId, clientId))
        .orderBy(desc(clientPortalActivityLogs.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Apply date filter if provided
      if (input.fromDate) {
        query = tenantDb
          .select()
          .from(clientPortalActivityLogs)
          .where(
            and(
              eq(clientPortalActivityLogs.clientId, clientId),
              gte(clientPortalActivityLogs.createdAt, new Date(input.fromDate))
            )
          )
          .orderBy(desc(clientPortalActivityLogs.createdAt))
          .limit(input.limit)
          .offset(input.offset);
      }

      const logs = await query;

      return {
        logs,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  /**
   * Get active sessions (login sessions)
   */
  getActiveSessions: publicProcedure
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

      const clientId = await validateClientSession(
        organizationId,
        input.sessionToken
      );
      const tenantDb = await getTenantDb(organizationId);

      // Get all active sessions for this client
      const activeSessions = await tenantDb
        .select()
        .from(clientPortalSessions)
        .where(eq(clientPortalSessions.clientId, clientId))
        .orderBy(desc(clientPortalSessions.lastActivityAt));

      // Filter out expired sessions
      const validSessions = activeSessions.filter(
        (session) => !isTokenExpired(session.expiresAt)
      );

      return {
        sessions: validSessions.map((session) => ({
          id: session.id,
          deviceType: session.deviceType,
          deviceName: session.deviceName,
          browser: session.browser,
          os: session.os,
          ipAddress: session.ipAddress,
          lastActivityAt: session.lastActivityAt,
          createdAt: session.createdAt,
          isCurrent: session.token === input.sessionToken,
        })),
      };
    }),

  /**
   * Revoke a session
   */
  revokeSession: publicProcedure
    .input(
      z.object({
        sessionToken: z.string().length(64),
        sessionIdToRevoke: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = (ctx.req.session as any).organizationId;
      if (!organizationId) {
        throw new Error("Not authenticated");
      }

      const clientId = await validateClientSession(
        organizationId,
        input.sessionToken
      );
      const tenantDb = await getTenantDb(organizationId);

      // Verify session ownership
      const sessionToRevoke = await tenantDb
        .select()
        .from(clientPortalSessions)
        .where(
          and(
            eq(clientPortalSessions.id, input.sessionIdToRevoke),
            eq(clientPortalSessions.clientId, clientId)
          )
        )
        .limit(1);

      if (sessionToRevoke.length === 0) {
        throw new Error("Session not found or access denied");
      }

      // Delete session
      await tenantDb
        .delete(clientPortalSessions)
        .where(eq(clientPortalSessions.id, input.sessionIdToRevoke));

      // Log activity
      await tenantDb.insert(clientPortalActivityLogs).values({
        clientId,
        action: "revoke_session",
        description: `Revoked session from ${sessionToRevoke[0].deviceType} (${sessionToRevoke[0].browser})`,
        status: "success",
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
      });

      return {
        message: "Session revoked successfully",
      };
    }),
});
