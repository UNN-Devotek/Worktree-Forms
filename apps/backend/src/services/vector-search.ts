/**
 * Pinecone vector search client.
 *
 * Wraps the Pinecone SDK to provide typed upsert, query, and delete
 * operations scoped by projectId metadata for tenant isolation.
 */
import { Pinecone } from '@pinecone-database/pinecone';
import type { RecordMetadata } from '@pinecone-database/pinecone';

let pineconeClient: Pinecone | null = null;

function getPinecone(): Pinecone {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
      ...(process.env.PINECONE_HOST
        ? { controllerHostUrl: process.env.PINECONE_HOST }
        : {}),
    });
  }
  return pineconeClient;
}

function getIndex() {
  const indexName = process.env.PINECONE_INDEX_NAME ?? 'worktree-local';

  if (process.env.PINECONE_HOST) {
    return getPinecone().index({ host: process.env.PINECONE_HOST });
  }

  return getPinecone().index({ name: indexName });
}

export interface EmbeddingMetadata extends RecordMetadata {
  projectId: string;
  submissionId: string;
  formId: string;
  entityType: string;
  text: string;
}

/**
 * Upsert a single vector with metadata into the Pinecone index.
 */
export async function upsertVector(
  id: string,
  vector: number[],
  metadata: EmbeddingMetadata,
): Promise<void> {
  await getIndex().upsert({
    records: [{ id, values: vector, metadata }],
  });
}

/**
 * Query the Pinecone index for vectors similar to the given vector,
 * scoped to a specific projectId via metadata filter.
 */
export async function queryVectors(
  vector: number[],
  projectId: string,
  topK = 5,
): Promise<Array<{ id: string; score: number; metadata: EmbeddingMetadata }>> {
  const response = await getIndex().query({
    vector,
    topK,
    filter: { projectId: { $eq: projectId } },
    includeMetadata: true,
  });

  return response.matches.map((m) => ({
    id: m.id,
    score: m.score ?? 0,
    metadata: m.metadata as unknown as EmbeddingMetadata,
  }));
}

/**
 * Delete vectors by their IDs.
 */
export async function deleteVectors(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await getIndex().deleteMany({ ids });
}

/**
 * Delete all vectors belonging to a specific project using a metadata filter.
 * Requires a Pinecone serverless index or pod index with filter-based deletion.
 */
export async function deleteProjectVectors(
  projectId: string,
): Promise<void> {
  await getIndex().deleteMany({
    filter: { projectId: { $eq: projectId } },
  });
}
