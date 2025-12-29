import { OpenAIEmbeddings } from "@langchain/openai";

let embeddingsInstance: OpenAIEmbeddings | null = null;

/**
 * Get singleton OpenAI embeddings instance
 * Model: text-embedding-3-small (1536 dimensions, $0.02/M tokens)
 */
export function getEmbeddings(): OpenAIEmbeddings {
  if (!embeddingsInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable required for embeddings");
    }

    embeddingsInstance = new OpenAIEmbeddings({
      model: "text-embedding-3-small",  // 1536 dimensions, 5x cheaper than ada-002
      apiKey: apiKey,
      maxRetries: 3,                     // Retry on rate limits
      timeout: 30000,                    // 30s timeout (embedding can be slow)
    });
  }

  return embeddingsInstance;
}

/**
 * Generate embeddings for conversation messages
 * Uses batching to avoid rate limits (embedDocuments handles this automatically)
 *
 * @param messages Array of formatted messages ("user: content" or "assistant: content")
 * @returns Array of embeddings (1536-dimensional vectors)
 */
export async function embedMessages(messages: string[]): Promise<number[][]> {
  const embeddings = getEmbeddings();

  // LangChain handles batching, rate limiting, retries automatically
  const vectors = await embeddings.embedDocuments(messages);

  return vectors;
}

/**
 * Generate embedding for a single query
 * Use this for retrieval queries, NOT for storing messages (use embedMessages for batch)
 *
 * @param query User's search query
 * @returns Single embedding vector (1536 dimensions)
 */
export async function embedQuery(query: string): Promise<number[]> {
  const embeddings = getEmbeddings();

  // embedQuery method optimized for single queries (vs embedDocuments for batches)
  const vector = await embeddings.embedQuery(query);

  return vector;
}
