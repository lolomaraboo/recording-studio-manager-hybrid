import { eq } from "drizzle-orm";
import { aiConversations } from "@rsm/database/tenant";
import { TenantDb } from "@rsm/database/connection";
import { retrieveRelevantChunks } from "./vectorStore";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

const RECENT_CONTEXT_COUNT = 15;  // Always load last 15 messages
const RAG_TOP_K = 5;               // Retrieve top-5 relevant chunks when triggered

/**
 * Memory keyword patterns - triggers RAG retrieval
 */
const MEMORY_PATTERNS = {
  explicit: /rappelle|souviens|mentionné|dit|parlé/i,           // Explicit memory: "rappelle-moi..."
  temporal: /avant|précédemment|dernier|semaine|mois|hier/i,    // Temporal: "la semaine dernière"
  reference: /premier|deuxième|troisième|précédent/i,           // Ordinal: "le premier client"
  question: /quel était|qu'est-ce que j'ai|qui était/i,         // Memory questions: "quel était le nom?"
};

/**
 * Detect if message requires memory retrieval (RAG)
 * @param message User's current message
 * @returns true if memory keywords detected
 */
function needsMemoryRetrieval(message: string): boolean {
  return Object.values(MEMORY_PATTERNS).some(pattern => pattern.test(message));
}

/**
 * Retrieve conversation context with conditional RAG strategy
 *
 * Strategy:
 * - ALWAYS: Recent context (last 15 messages) for continuity
 * - CONDITIONAL: RAG retrieval (top-5 relevant) if memory keywords detected
 * - NO DUPLICATION: RAG excludes recent messages already loaded
 *
 * @param sessionId Conversation session ID
 * @param currentMessage User's current message (for keyword detection + semantic search)
 * @param organizationId Tenant organization ID (for Qdrant filtering)
 * @param tenantDb Tenant database connection
 * @returns Array of messages for LLM context
 */
export async function retrieveConversationContext(
  sessionId: string,
  currentMessage: string,
  organizationId: number,
  tenantDb: TenantDb
): Promise<Message[]> {
  // Load full conversation from PostgreSQL
  const existingConversations = await tenantDb
    .select()
    .from(aiConversations)
    .where(eq(aiConversations.sessionId, sessionId))
    .limit(1);

  if (existingConversations.length === 0) {
    // New conversation, no history
    return [];
  }

  const allMessages: Message[] = JSON.parse(existingConversations[0].messages || "[]");
  const messageCount = allMessages.length;

  // ALWAYS get recent context (last 15 messages)
  const recentMessages = allMessages.slice(-RECENT_CONTEXT_COUNT);

  console.log(`[MemoryRetriever] Loaded ${recentMessages.length} recent messages (total: ${messageCount})`);

  // Check if memory retrieval needed
  const needsRAG = needsMemoryRetrieval(currentMessage);

  if (!needsRAG) {
    // Normal question: just recent context
    console.log(`[MemoryRetriever] No memory keywords detected, using recent context only`);
    return recentMessages;
  }

  // Memory reference detected: add RAG retrieval
  console.log(`[MemoryRetriever] Memory keywords detected, triggering RAG retrieval`);

  try {
    // Retrieve semantically relevant chunks from OLD messages (exclude recent)
    const relevantDocs = await retrieveRelevantChunks(
      currentMessage,
      organizationId,
      sessionId,
      RAG_TOP_K
    );

    // Extract message indices from relevant chunks
    const relevantIndices = new Set<number>();
    relevantDocs.forEach((doc) => {
      const messageIndex = doc.metadata.messageIndex;
      if (typeof messageIndex === "number") {
        relevantIndices.add(messageIndex);
      }
    });

    // Get indices of recent messages (to avoid duplication)
    const recentIndices = new Set(
      Array.from({ length: RECENT_CONTEXT_COUNT }, (_, i) => messageCount - RECENT_CONTEXT_COUNT + i)
        .filter(i => i >= 0)
    );

    // Filter RAG results: only OLD messages (not in recent context)
    const oldRelevantIndices = Array.from(relevantIndices)
      .filter(i => !recentIndices.has(i))
      .sort((a, b) => a - b);

    const oldRelevantMessages = oldRelevantIndices.map(i => allMessages[i]);

    // Combine: OLD relevant messages + RECENT messages (chronological order)
    const combinedContext = [...oldRelevantMessages, ...recentMessages];

    console.log(
      `[MemoryRetriever] Retrieved ${oldRelevantMessages.length} old relevant + ${recentMessages.length} recent = ${combinedContext.length} total messages`
    );

    return combinedContext;

  } catch (error) {
    // Graceful degradation: fall back to recent context if RAG fails
    console.error("[MemoryRetriever] RAG retrieval failed, falling back to recent context only:", error);
    return recentMessages;
  }
}
