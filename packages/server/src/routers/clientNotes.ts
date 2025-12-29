import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, desc } from 'drizzle-orm';
import { router, protectedProcedure } from '../_core/trpc';
import { clientNotes, clients } from '@rsm/database/tenant';

/**
 * Client Notes Router
 *
 * CRUD for client notes history (stored in Tenant DB)
 *
 * Endpoints:
 * - list: Get all notes for a specific client
 * - create: Create new note for a client
 * - delete: Delete a note
 */
export const clientNotesRouter = router({
  /**
   * List notes for a specific client
   * Returns notes ordered by newest first
   */
  list: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Verify client exists and belongs to this organization
      const client = await tenantDb.query.clients.findFirst({
        where: eq(clients.id, input.clientId),
      });

      if (!client) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found',
        });
      }

      // Get all notes for this client, ordered by newest first
      const notes = await tenantDb
        .select()
        .from(clientNotes)
        .where(eq(clientNotes.clientId, input.clientId))
        .orderBy(desc(clientNotes.createdAt));

      return notes;
    }),

  /**
   * Create new note for a client
   */
  create: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        note: z.string().min(1, 'Note cannot be empty').trim(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Verify client exists and belongs to this organization
      const client = await tenantDb.query.clients.findFirst({
        where: eq(clients.id, input.clientId),
      });

      if (!client) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found',
        });
      }

      // Create the note
      const [note] = await tenantDb
        .insert(clientNotes)
        .values({
          clientId: input.clientId,
          note: input.note,
          createdBy: ctx.user.id, // Track who created the note
        })
        .returning();

      return note;
    }),

  /**
   * Delete a note
   * Only allows deletion of notes that belong to the organization's clients
   */
  delete: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Verify note exists and belongs to a client in this organization
      const note = await tenantDb.query.clientNotes.findFirst({
        where: eq(clientNotes.id, input.id),
      });

      if (!note) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Note not found',
        });
      }

      // Verify the client exists (security check)
      const client = await tenantDb.query.clients.findFirst({
        where: eq(clients.id, note.clientId),
      });

      if (!client) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to delete this note',
        });
      }

      // Delete the note
      await tenantDb.delete(clientNotes).where(eq(clientNotes.id, input.id));

      return { success: true };
    }),
});
