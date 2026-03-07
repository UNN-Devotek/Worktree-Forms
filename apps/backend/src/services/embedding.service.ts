/**
 * Embedding service for RAG ingestion and semantic search.
 *
 * Uses OpenAI text-embedding-3-small for vector generation and
 * Pinecone for similarity search. Metadata references are stored
 * in DynamoDB via VectorEmbeddingEntity.
 */
import OpenAI from 'openai';
import {
  upsertVector,
  queryVectors,
  deleteVectors,
  type EmbeddingMetadata,
} from './vector-search.js';
import { VectorEmbeddingEntity } from '../lib/dynamo/index.js';

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

/**
 * Generate an embedding vector for the given text using OpenAI.
 * Falls back to a random mock vector when the API key is missing
 * or set to a placeholder (local development).
 */
export async function createEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.startsWith('sk-placeholder')) {
    console.warn(
      'OpenAI API Key missing or placeholder. Returning zero embedding.',
    );
    // Zero vector — random vectors would pollute a shared Pinecone index with noise
    return new Array(1536).fill(0);
  }

  const response = await getOpenAI().embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8192), // truncate to model max
  });

  return response.data[0].embedding;
}

/**
 * Build a human-readable text representation of submission data
 * suitable for embedding.
 */
function submissionToText(data: Record<string, unknown>): string {
  return Object.entries(data)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join('\n');
}

/**
 * Embed a submission into Pinecone and store a metadata reference
 * in DynamoDB. Idempotent -- re-calling with the same IDs overwrites
 * the previous vector.
 */
export async function embedSubmission(
  projectId: string,
  submissionId: string,
  formId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const text = submissionToText(data);
  if (!text.trim()) return;

  const vector = await createEmbedding(text);
  const embeddingId = `${projectId}:${submissionId}`;

  const metadata: EmbeddingMetadata = {
    projectId,
    submissionId,
    formId,
    entityType: 'submission',
    text: text.slice(0, 1000), // store first 1000 chars as metadata
  };

  await upsertVector(embeddingId, vector, metadata);

  // Store metadata reference in DynamoDB.
  // patch().set() only updates the text chunk and leaves createdAt untouched on re-embed.
  // Falls back to create() when the record doesn't exist yet.
  try {
    await VectorEmbeddingEntity.patch({ projectId, embeddingId })
      .set({ textChunk: text.slice(0, 500) })
      .go();
  } catch {
    await VectorEmbeddingEntity.create({
      embeddingId,
      projectId,
      submissionId,
      pineconeId: embeddingId,
      textChunk: text.slice(0, 500),
      createdAt: new Date().toISOString(),
    }).go().catch(() => {/* record was created by a concurrent request */});
  }
}

/**
 * Embed a help article (system-level, not scoped to a project).
 */
export async function embedHelpArticle(
  articleId: string,
  title: string,
  content: string,
): Promise<void> {
  const text = `${title}\n\n${content}`;
  const vector = await createEmbedding(text);
  const embeddingId = `helparticle:${articleId}`;

  await upsertVector(embeddingId, vector, {
    projectId: 'system',
    submissionId: '',
    formId: '',
    entityType: 'help_article',
    text: text.slice(0, 1000),
  });
}

/**
 * Perform a semantic search against project submissions.
 * Returns the top-K most similar submissions with scores.
 */
export async function semanticSearch(
  query: string,
  projectId: string,
  topK = 5,
  minScore = 0.65,
): Promise<Array<{ submissionId: string; score: number; text: string }>> {
  const vector = await createEmbedding(query);
  const results = await queryVectors(vector, projectId, topK);

  return results
    .filter((r) => r.metadata.submissionId !== '' && r.score >= minScore)
    .map((r) => ({
      submissionId: r.metadata.submissionId,
      score: r.score,
      text: r.metadata.text,
    }));
}

/**
 * Delete the embedding for a specific submission from both
 * Pinecone and DynamoDB.
 */
export async function deleteSubmissionEmbedding(
  projectId: string,
  submissionId: string,
): Promise<void> {
  const embeddingId = `${projectId}:${submissionId}`;
  await deleteVectors([embeddingId]);
  // Clean up DynamoDB record -- swallow errors if record is already gone
  await VectorEmbeddingEntity.delete({ projectId, embeddingId })
    .go()
    .catch(() => {});
}

/**
 * Legacy static class wrapper kept for backward compatibility with
 * existing route imports. Delegates to the module-level functions.
 */
export class EmbeddingService {
  static generateEmbedding = createEmbedding;

  static async storeEmbedding(
    submissionId: string,
    projectId: string,
    content: string,
    pineconeId: string,
  ) {
    // Use upsert (not create) so re-calling with the same pineconeId doesn't throw
    await VectorEmbeddingEntity.upsert({
      embeddingId: pineconeId,
      projectId,
      submissionId,
      pineconeId,
      textChunk: content,
    }).go();
  }

  static async ingestSubmission(
    submissionId: string,
    projectId: string,
    data: unknown,
  ) {
    const record =
      data && typeof data === 'object'
        ? (data as Record<string, unknown>)
        : { raw: String(data) };

    await embedSubmission(projectId, submissionId, '', record);
    return { success: true };
  }
}
