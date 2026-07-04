import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { tasks } from "@rsm/database/tenant/schema";
import { desc, eq } from "drizzle-orm";

/**
 * Tasks Router
 * Checklist items / to-dos, linkable to a project / session / client
 * (status: todo | doing | done).
 */
export const tasksRouter = router({
  /**
   * List all tasks (most recent first)
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const tenantDb = await ctx.getTenantDb();
    return tenantDb.select().from(tasks).orderBy(desc(tasks.createdAt));
  }),

  /**
   * Get task by ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const rows = await tenantDb
        .select()
        .from(tasks)
        .where(eq(tasks.id, input.id))
        .limit(1);
      if (rows.length === 0) throw new Error("Task not found");
      return rows[0];
    }),

  /**
   * Create a new task
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        status: z.enum(["todo", "doing", "done"]).default("todo"),
        dueDate: z.date().optional(),
        assignee: z.string().max(255).optional(),
        projectId: z.number().optional(),
        sessionId: z.number().optional(),
        clientId: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const inserted = await tenantDb
        .insert(tasks)
        .values({
          title: input.title,
          status: input.status,
          dueDate: input.dueDate ?? null,
          assignee: input.assignee ?? null,
          projectId: input.projectId ?? null,
          sessionId: input.sessionId ?? null,
          clientId: input.clientId ?? null,
          notes: input.notes ?? null,
        })
        .returning();
      return inserted[0];
    }),

  /**
   * Update a task (status / details).
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        status: z.enum(["todo", "doing", "done"]).optional(),
        dueDate: z.date().optional(),
        assignee: z.string().max(255).optional(),
        projectId: z.number().optional(),
        sessionId: z.number().optional(),
        clientId: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const { id, ...updateData } = input;
      const updated = await tenantDb
        .update(tasks)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(tasks.id, id))
        .returning();
      if (updated.length === 0) throw new Error("Task not found");
      return updated[0];
    }),

  /**
   * Delete a task.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      await tenantDb.delete(tasks).where(eq(tasks.id, input.id));
      return { success: true };
    }),
});
