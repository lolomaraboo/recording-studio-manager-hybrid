import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { leads, clients } from "@rsm/database/tenant/schema";
import { desc, eq } from "drizzle-orm";

/**
 * Leads Router
 * CRM pipeline / booking inquiries before a client exists
 * (status: new | contacted | quoted | won | lost).
 */
export const leadsRouter = router({
  /**
   * List all leads (most recent first)
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const tenantDb = await ctx.getTenantDb();
    return tenantDb.select().from(leads).orderBy(desc(leads.createdAt));
  }),

  /**
   * Get lead by ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const rows = await tenantDb
        .select()
        .from(leads)
        .where(eq(leads.id, input.id))
        .limit(1);
      if (rows.length === 0) throw new Error("Lead not found");
      return rows[0];
    }),

  /**
   * Create a new lead
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        contactEmail: z.string().max(255).optional(),
        contactPhone: z.string().max(50).optional(),
        source: z.string().max(100).optional(),
        status: z.enum(["new", "contacted", "quoted", "won", "lost"]).default("new"),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const inserted = await tenantDb
        .insert(leads)
        .values({
          name: input.name,
          contactEmail: input.contactEmail ?? null,
          contactPhone: input.contactPhone ?? null,
          source: input.source ?? null,
          status: input.status,
          notes: input.notes ?? null,
        })
        .returning();
      return inserted[0];
    }),

  /**
   * Update a lead (status / details).
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        contactEmail: z.string().max(255).optional(),
        contactPhone: z.string().max(50).optional(),
        source: z.string().max(100).optional(),
        status: z.enum(["new", "contacted", "quoted", "won", "lost"]).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const { id, ...updateData } = input;
      const updated = await tenantDb
        .update(leads)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(leads.id, id))
        .returning();
      if (updated.length === 0) throw new Error("Lead not found");
      return updated[0];
    }),

  /**
   * Delete a lead.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      await tenantDb.delete(leads).where(eq(leads.id, input.id));
      return { success: true };
    }),

  /**
   * Convert a lead into a client, then mark the lead as won.
   */
  convertToClient: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const rows = await tenantDb
        .select()
        .from(leads)
        .where(eq(leads.id, input.id))
        .limit(1);
      if (rows.length === 0) throw new Error("Lead not found");
      const lead = rows[0];

      if (lead.convertedClientId) {
        throw new Error("Lead already converted");
      }

      const insertedClient = await tenantDb
        .insert(clients)
        .values({
          name: lead.name,
          email: lead.contactEmail ?? null,
          phone: lead.contactPhone ?? null,
          notes: lead.notes ?? null,
        })
        .returning();
      const client = insertedClient[0];

      await tenantDb
        .update(leads)
        .set({ status: "won", convertedClientId: client.id, updatedAt: new Date() })
        .where(eq(leads.id, input.id));

      return { clientId: client.id };
    }),
});
