import { getQdrantClient } from "./qdrantClient";

const COLLECTION_NAME = "chatbot_memory";

/**
 * Initialize Qdrant collection for chatbot memory
 * Only runs once - idempotent (safe to call multiple times)
 */
export async function initializeQdrantCollection(): Promise<void> {
  const client = getQdrantClient();

  // Check if collection already exists
  const collections = await client.getCollections();
  const exists = collections.collections.some((c) => c.name === COLLECTION_NAME);

  if (exists) {
    console.log(`[Qdrant] Collection "${COLLECTION_NAME}" already exists`);
    return;
  }

  // Create collection with OpenAI text-embedding-3-small config
  await client.createCollection(COLLECTION_NAME, {
    vectors: {
      size: 1536,              // text-embedding-3-small dimension
      distance: "Cosine",      // Auto-normalizes vectors
    },
    optimizers_config: {
      indexing_threshold: 10000,  // Build HNSW after 10k vectors
    },
    hnsw_config: {
      m: 16,                   // HNSW graph connections (16 = balanced)
      ef_construct: 100,       // Build quality (100 = good for 100k+ vectors)
    },
  });

  // Create payload index for fast organizationId filtering (CRITICAL for multi-tenancy)
  await client.createPayloadIndex(COLLECTION_NAME, {
    field_name: "organizationId",
    field_schema: "integer",
  });

  // Create payload index for timestamp filtering (for recency bias)
  await client.createPayloadIndex(COLLECTION_NAME, {
    field_name: "timestamp",
    field_schema: "datetime",
  });

  console.log(`[Qdrant] Collection "${COLLECTION_NAME}" created successfully`);
}
