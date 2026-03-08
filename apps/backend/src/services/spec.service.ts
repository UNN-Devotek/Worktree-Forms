import { FileUploadEntity } from '../lib/dynamo/index.js';
import { nanoid } from 'nanoid';
import { createEmbedding } from './embedding.service.js';
import { upsertVector, queryVectors, deleteVectors } from './vector-search.js';

/**
 * Specifications are stored as FileUpload entities with metadata in the
 * mimeType field set to a spec-specific marker. In the DynamoDB world we
 * don't have a separate Specification table -- specs are files with extra
 * metadata stored alongside other uploads.
 */
export class SpecService {
  /**
   * Create a new Specification entry (backed by FileUploadEntity).
   * Embeds the title + keywords into Pinecone for semantic search.
   */
  static async createSpec(data: {
    projectId: string;
    section?: string;
    title: string;
    keywords?: string;
    type?: string;
    fileUrl: string;
    objectKey: string;
    uploadedById: string;
  }) {
    const fileId = nanoid();
    const result = await FileUploadEntity.create({
      fileId,
      projectId: data.projectId,
      objectKey: data.objectKey,
      originalName: data.title,
      mimeType: `application/x-spec-${(data.type || 'SPEC').toLowerCase()}`,
      uploadedBy: data.uploadedById,
    }).go();

    // Embed title + keywords into Pinecone for semantic search
    const embeddingText = data.keywords
      ? `${data.title} ${data.keywords}`
      : data.title;

    try {
      const vector = await createEmbedding(embeddingText);
      await upsertVector(fileId, vector, {
        projectId: data.projectId,
        submissionId: '',
        formId: '',
        entityType: 'spec',
        text: embeddingText.slice(0, 1000),
      });
    } catch (embedError) {
      // Non-fatal: log but don't fail the create operation
      console.error('SpecService: Failed to embed spec into Pinecone:', embedError);
    }

    return result.data;
  }

  /**
   * Keyword search for Specifications in a project (DynamoDB client-side filter).
   */
  static async searchSpecs(projectId: string, query: string, type: string = 'SPEC') {
    const result = await FileUploadEntity.query.primary({ projectId }).go();
    const specMime = `application/x-spec-${type.toLowerCase()}`;
    let specs = result.data.filter((f) => f.mimeType === specMime);

    if (query && query.length >= 2) {
      const lowerQ = query.toLowerCase();
      specs = specs.filter(
        (s) =>
          (s.originalName ?? '').toLowerCase().includes(lowerQ) ||
          s.objectKey.toLowerCase().includes(lowerQ),
      );
    }

    return specs;
  }

  /**
   * Semantic search for Specifications using Pinecone vector similarity.
   * Embeds the query, queries Pinecone filtered by entityType:'spec', then
   * fetches full FileUpload records for each matched fileId.
   */
  static async semanticSearchSpecs(projectId: string, query: string, topK = 5, minScore = 0.65) {
    const vector = await createEmbedding(query);
    const matches = await queryVectors(vector, projectId, topK);

    // Filter by entityType and apply minimum similarity score threshold to avoid
    // returning irrelevant results when no good semantic match exists.
    const specMatches = matches.filter(
      (m) => m.metadata.entityType === 'spec' && m.score >= minScore
    );
    if (specMatches.length === 0) return [];

    const records = await Promise.all(
      specMatches.map((m) =>
        FileUploadEntity.get({ projectId, fileId: m.id }).go(),
      ),
    );

    return records
      .map((r) => r.data)
      .filter((d): d is NonNullable<typeof d> => d !== null && d !== undefined);
  }

  /**
   * Delete a Specification
   */
  static async deleteSpec(projectId: string, fileId: string) {
    await FileUploadEntity.delete({ projectId, fileId }).go();
    // Also remove the Pinecone vector so deleted specs don't surface in semantic search
    try {
      await deleteVectors([fileId]);
    } catch (vectorError) {
      console.error('SpecService: Failed to delete Pinecone vector for spec:', vectorError);
    }
  }
}
