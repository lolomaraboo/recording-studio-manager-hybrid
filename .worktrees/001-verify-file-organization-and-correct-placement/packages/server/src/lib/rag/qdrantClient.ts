import { QdrantClient } from "@qdrant/js-client-rest";

let qdrantClient: QdrantClient | null = null;

export function getQdrantClient(): QdrantClient {
  if (!qdrantClient) {
    const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";
    qdrantClient = new QdrantClient({ url: qdrantUrl });
  }
  return qdrantClient;
}
