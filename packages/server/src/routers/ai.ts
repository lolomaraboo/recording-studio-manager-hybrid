import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import { aiConversations, aiActionLogs } from "@rsm/database/tenant";
import { eq, desc } from "drizzle-orm";
import { getLLMProvider } from "../lib/llmProvider";
import { AIActionExecutor } from "../lib/aiActions";
import { AI_TOOLS } from "../lib/aiTools";
import { SYSTEM_PROMPT } from "../lib/aiSystemPrompt";
import { HallucinationDetector } from "../lib/hallucinationDetector";

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
   * Phase 2.2: Full implementation with LLM provider + AI actions
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
      const { message, sessionId: inputSessionId, context } = input;

      // Generate or reuse session ID
      const sessionId = inputSessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Get LLM provider
      const llm = getLLMProvider();

      // Create AI action executor with tenant DB
      const actionExecutor = new AIActionExecutor(tenantDb);

      // Load conversation history if session exists
      let conversationHistory: any[] = [];
      if (inputSessionId) {
        const existingConversations = await tenantDb
          .select()
          .from(aiConversations)
          .where(eq(aiConversations.sessionId, inputSessionId))
          .limit(1);

        if (existingConversations.length > 0) {
          conversationHistory = JSON.parse(existingConversations[0].messages || "[]");
        }
      }

      // Add user message to history
      conversationHistory.push({
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      });

      // Prepare messages for LLM (without timestamps)
      const llmMessages = conversationHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        // Call LLM with tools
        const llmResponse = await llm.chatCompletion({
          messages: llmMessages,
          systemPrompt: SYSTEM_PROMPT,
          temperature: 0.7,
          maxTokens: 4096,
          tools: AI_TOOLS,
        });

        const actionsCalled: string[] = [];
        let finalResponse = llmResponse.content;

        // Execute tool calls if any
        if (llmResponse.toolCalls && llmResponse.toolCalls.length > 0) {
          const toolResults: any[] = [];

          for (const toolCall of llmResponse.toolCalls) {
            const startTime = Date.now();

            try {
              // Execute action
              const result = await actionExecutor.execute(toolCall.name, toolCall.input);

              // Log action
              await tenantDb.insert(aiActionLogs).values({
                sessionId,
                actionName: toolCall.name,
                params: JSON.stringify(toolCall.input),
                result: JSON.stringify(result),
                status: result.success ? "success" : "error",
                error: result.error,
                executionTimeMs: Date.now() - startTime,
              });

              toolResults.push({
                toolUseId: toolCall.id,
                name: toolCall.name,
                result: result.data,
              });

              actionsCalled.push(toolCall.name);
            } catch (error: any) {
              // Log error
              await tenantDb.insert(aiActionLogs).values({
                sessionId,
                actionName: toolCall.name,
                params: JSON.stringify(toolCall.input),
                result: null,
                status: "error",
                error: error.message,
                executionTimeMs: Date.now() - startTime,
              });

              toolResults.push({
                toolUseId: toolCall.id,
                name: toolCall.name,
                error: error.message,
              });
            }
          }

          // If tools were called, make a second LLM call with results
          if (toolResults.length > 0) {
            const followUpMessages = [
              ...llmMessages,
              {
                role: "assistant" as const,
                content: llmResponse.content || "",
              },
              {
                role: "user" as const,
                content: `Tool results: ${JSON.stringify(toolResults)}`,
              },
            ];

            const followUpResponse = await llm.chatCompletion({
              messages: followUpMessages,
              systemPrompt: SYSTEM_PROMPT,
              temperature: 0.7,
              maxTokens: 4096,
            });

            finalResponse = followUpResponse.content;

            // Hallucination detection (Phase 2.3)
            const detector = new HallucinationDetector();
            const hallucinationResult = await detector.detect(
              finalResponse,
              llmResponse.toolCalls,
              toolResults
            );

            // Log hallucination detection results
            if (hallucinationResult.hasHallucination) {
              console.warn(
                `[AI Router] Hallucination detected (confidence: ${hallucinationResult.confidence}%):`,
                hallucinationResult.issues
              );
            }

            // Add warnings to response if confidence is low
            if (hallucinationResult.confidence < 80 && hallucinationResult.warnings.length > 0) {
              console.warn(
                `[AI Router] Low confidence (${hallucinationResult.confidence}%):`,
                hallucinationResult.warnings
              );
            }
          }
        }

        // Add assistant response to history
        conversationHistory.push({
          role: "assistant",
          content: finalResponse,
          timestamp: new Date().toISOString(),
          actionsCalled: actionsCalled.length > 0 ? actionsCalled : undefined,
        });

        // Save conversation to DB
        const existingConversations = await tenantDb
          .select()
          .from(aiConversations)
          .where(eq(aiConversations.sessionId, sessionId))
          .limit(1);

        if (existingConversations.length > 0) {
          // Update existing
          await tenantDb
            .update(aiConversations)
            .set({
              messages: JSON.stringify(conversationHistory),
              totalMessages: conversationHistory.length,
              actionsCalled: JSON.stringify(actionsCalled),
              updatedAt: new Date(),
            })
            .where(eq(aiConversations.sessionId, sessionId));
        } else {
          // Create new
          await tenantDb.insert(aiConversations).values({
            sessionId,
            userId: ctx.user!.id,
            pageContext: context ? JSON.stringify(context) : null,
            messages: JSON.stringify(conversationHistory),
            totalMessages: conversationHistory.length,
            actionsCalled: actionsCalled.length > 0 ? JSON.stringify(actionsCalled) : null,
          });
        }

        // Return response
        return {
          response: finalResponse,
          sessionId,
          actionsCalled,
          creditsUsed: llmResponse.usage.inputTokens + llmResponse.usage.outputTokens,
        };
      } catch (error: any) {
        console.error("[AI Router] Chat error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `AI chat failed: ${error.message}`,
        });
      }
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
