import { QdrantVectorStore } from "@langchain/qdrant";
import { Document } from "@langchain/core/documents";
import { getEmbeddings } from "./embeddingService";
import { getQdrantClient } from "./qdrantClient";

const COLLECTION_NAME = "chatbot_memory";

/**
 * Get QdrantVectorStore instance connected to chatbot_memory collection
 */
export async function getVectorStore(): Promise<QdrantVectorStore> {
  const embeddings = getEmbeddings();
  const client = getQdrantClient();

  const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
    client: client,
    collectionName: COLLECTION_NAME,
  });

  return vectorStore;
}

/**
 * Store conversation chunks in Qdrant
 * Generates embeddings and upserts to vector database
 *
 * @param chunks Array of LangChain Documents (from conversationChunker)
 * @returns Number of chunks stored
 */
export async function storeConversationChunks(chunks: Document[]): Promise<number> {
  if (chunks.length === 0) {
    return 0;
  }

  const vectorStore = await getVectorStore();

  // QdrantVectorStore.addDocuments handles:
  // 1. Embedding generation (batch via embedDocuments)
  // 2. Vector normalization (Cosine distance)
  // 3. Upsert to Qdrant collection
  await vectorStore.addDocuments(chunks);

  console.log(`[VectorStore] Stored ${chunks.length} conversation chunks`);

  return chunks.length;
}

/**
 * Retrieve relevant conversation chunks using semantic search
 * CRITICAL: Always filters by organizationId (tenant isolation)
 *
 * @param query User's current message (semantic search query)
 * @param organizationId Tenant organization ID
 * @param sessionId Optional: filter to specific conversation
 * @param topK Number of chunks to retrieve (default 5)
 * @returns Array of relevant documents with similarity scores
 */
export async function retrieveRelevantChunks(
  query: string,
  organizationId: number,
  sessionId?: string,
  topK: number = 5
): Promise<Document[]> {
  const vectorStore = await getVectorStore();

  // Build tenant isolation filter (CRITICAL: prevent data leakage)
  const mustFilters: any[] = [
    { key: "organizationId", match: { value: organizationId } }
  ];

  // Optional: filter to specific session
  if (sessionId) {
    mustFilters.push({ key: "sessionId", match: { value: sessionId } });
  }

  // Create retriever with hybrid search (semantic + metadata filtering)
  const retriever = vectorStore.asRetriever({
    k: topK,
    filter: {
      must: mustFilters
    }
  });

  // Retrieve semantically relevant chunks
  const relevantDocs = await retriever.invoke(query);

  console.log(`[VectorStore] Retrieved ${relevantDocs.length} relevant chunks for org ${organizationId}`);

  return relevantDocs;
}
