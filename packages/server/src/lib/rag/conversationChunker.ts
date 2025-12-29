import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { encoding_for_model } from "tiktoken";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

/**
 * Chunk conversation messages for vector storage
 * Strategy: Message-level chunks with 400-token target, 50-token overlap
 *
 * @param messages Array of conversation messages
 * @param sessionId Conversation session ID
 * @param organizationId Tenant organization ID (CRITICAL for multi-tenancy)
 * @returns Array of LangChain Documents ready for embedding
 */
export async function chunkConversation(
  messages: Message[],
  sessionId: string,
  organizationId: number
): Promise<Document[]> {
  // Format messages: "role: content" (semantic coherence for embeddings)
  const formattedMessages = messages.map((msg, index) => {
    return {
      pageContent: `${msg.role}: ${msg.content}`,
      metadata: {
        organizationId,           // CRITICAL: tenant isolation
        sessionId,
        messageIndex: index,
        role: msg.role,
        timestamp: msg.timestamp || new Date().toISOString(),
        embeddingModel: "text-embedding-3-small",  // Version tracking
      }
    };
  });

  // Create LangChain Documents
  const docs = formattedMessages.map(
    (msg) => new Document({
      pageContent: msg.pageContent,
      metadata: msg.metadata,
    })
  );

  // Split into chunks (400 tokens target, 50 token overlap)
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 400,          // ~100 words, 2-3 messages
    chunkOverlap: 50,        // 12.5% overlap (recommended 10-20%)
    separators: ["\n\n", "\n", " ", ""],  // Preserve semantic boundaries
    lengthFunction: countTokens,          // Use tiktoken for accurate token count
  });

  const chunks = await splitter.splitDocuments(docs);

  return chunks;
}

/**
 * Count tokens using tiktoken (accurate for OpenAI models)
 * Used by RecursiveCharacterTextSplitter to respect 400-token chunk size
 */
function countTokens(text: string): number {
  const encoder = encoding_for_model("gpt-3.5-turbo");  // Same tokenizer as embeddings
  const tokens = encoder.encode(text);
  encoder.free();  // Important: free memory after encoding
  return tokens.length;
}
