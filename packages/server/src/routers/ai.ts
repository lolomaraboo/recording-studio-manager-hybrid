import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import { aiConversations, aiActionLogs } from "@rsm/database/tenant";
import { eq, desc } from "drizzle-orm";

/**
 * AI Chatbot Router
 *
 * Endpoints for AI assistant functionality:
 * - chat: Send message and get AI response
 * - getHistory: Get conversation history
 * - clearHistory: Clear conversation history
 * - getActionLogs: Get AI action execution logs
 *
 * Phase 2.1 - Basic router structure (placeholder implementations)
 */
export const aiRouter = router({
  /**
   * Chat with AI assistant
   *
   * Phase 2.1: Placeholder implementation
   * Phase 2.2: Will integrate with LLM provider + AI actions
   */
  chat: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(5000),
        sessionId: z.string().optional(), // Optional: resume existing conversation
        context: z
          .object({
            url: z.string().optional(), // Current page URL
            projectId: z.number().optional(), // Current project context
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const { message, sessionId, context } = input;

      // TODO Phase 2.2: Implement LLM provider integration
      // TODO Phase 2.2: Implement AI actions execution
      // TODO Phase 2.2: Implement hallucination detection

      // Placeholder response
      return {
        response: "AI chatbot is being implemented. This is a placeholder response.",
        sessionId: sessionId || `session_${Date.now()}`,
        actionsCalled: [] as string[],
        creditsUsed: 0,
      };
    }),

  /**
   * Get conversation history
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const { sessionId } = input;

      const conversations = await tenantDb
        .select()
        .from(aiConversations)
        .where(eq(aiConversations.sessionId, sessionId))
        .limit(1);

      if (conversations.length === 0) {
        return {
          sessionId,
          messages: [],
          totalMessages: 0,
        };
      }

      const conversation = conversations[0];
      const messages = JSON.parse(conversation.messages || "[]");

      return {
        sessionId: conversation.sessionId,
        messages,
        totalMessages: conversation.totalMessages,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };
    }),

  /**
   * Clear conversation history
   */
  clearHistory: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const { sessionId } = input;

      // Delete conversation
      await tenantDb
        .delete(aiConversations)
        .where(eq(aiConversations.sessionId, sessionId));

      // Delete action logs
      await tenantDb
        .delete(aiActionLogs)
        .where(eq(aiActionLogs.sessionId, sessionId));

      return {
        success: true,
        message: "Conversation history cleared",
      };
    }),

  /**
   * Get AI action execution logs
   */
  getActionLogs: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const { sessionId, limit, offset } = input;

      let query = tenantDb.select().from(aiActionLogs).orderBy(desc(aiActionLogs.createdAt));

      if (sessionId) {
        query = query.where(eq(aiActionLogs.sessionId, sessionId));
      }

      const logs = await query.limit(limit).offset(offset);

      return logs.map((log) => ({
        id: log.id,
        sessionId: log.sessionId,
        actionName: log.actionName,
        params: log.params ? JSON.parse(log.params) : null,
        result: log.result ? JSON.parse(log.result) : null,
        status: log.status,
        error: log.error,
        executionTimeMs: log.executionTimeMs,
        createdAt: log.createdAt,
      }));
    }),

  /**
   * Get AI credits for current organization
   *
   * TODO Phase 2.1 Day 6-7: Implement with Redis caching
   */
  getCredits: protectedProcedure.query(async ({ ctx }) => {
    // TODO: Implement credits fetching from Master DB + Redis cache
    // For now, return placeholder
    return {
      creditsRemaining: 100,
      creditsUsedThisMonth: 0,
      plan: "trial",
      limit: 100,
    };
  }),
});
