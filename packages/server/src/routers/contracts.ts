import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { contracts } from "@rsm/database/tenant/schema";
import { eq } from "drizzle-orm";

/**
 * Contracts Router
 * Manages legal contracts with clients
 */
export const contractsRouter = router({
  /**
   * List all contracts
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantDb) {
      throw new Error("Tenant database not available");
    }

    const contractsList = await ctx.tenantDb.select().from(contracts);
    return contractsList;
  }),

  /**
   * Get contract by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      const contract = await ctx.tenantDb.select().from(contracts).where(eq(contracts.id, input.id)).limit(1);

      if (contract.length === 0) {
        throw new Error("Contract not found");
      }

      return contract[0];
    }),

  /**
   * Create new contract
   */
  create: protectedProcedure
    .input(
      z.object({
        contractNumber: z.string().max(100),
        clientId: z.number(),
        projectId: z.number().optional(),
        type: z.enum([
          "recording",
          "mixing",
          "mastering",
          "production",
          "exclusivity",
          "distribution",
          "studio_rental",
          "services",
          "partnership",
          "other",
        ]),
        title: z.string().max(255),
        description: z.string().optional(),
        terms: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        value: z.string().optional(),
        documentUrl: z.string().max(500).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      const newContract = await ctx.tenantDb.insert(contracts).values(input as any).returning();

      return newContract[0];
    }),

  /**
   * Update contract
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z
          .enum(["draft", "sent", "pending_signature", "signed", "active", "expired", "terminated", "cancelled"])
          .optional(),
        title: z.string().max(255).optional(),
        description: z.string().optional(),
        terms: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        signedAt: z.date().optional(),
        value: z.string().optional(),
        documentUrl: z.string().max(500).optional(),
        signedDocumentUrl: z.string().max(500).optional(),
        signatureRequestId: z.string().max(255).optional(),
        signedBy: z.string().max(255).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      const { id, ...updateData } = input;

      const updated = await ctx.tenantDb.update(contracts).set(updateData).where(eq(contracts.id, id)).returning();

      if (updated.length === 0) {
        throw new Error("Contract not found");
      }

      return updated[0];
    }),

  /**
   * Delete contract
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      await ctx.tenantDb.delete(contracts).where(eq(contracts.id, input.id));

      return { success: true };
    }),
});
