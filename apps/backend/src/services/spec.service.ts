import { FileUploadEntity } from '../lib/dynamo/index.js';
import { nanoid } from 'nanoid';

/**
 * Specifications are stored as FileUpload entities with metadata in the
 * mimeType field set to a spec-specific marker. In the DynamoDB world we
 * don't have a separate Specification table -- specs are files with extra
 * metadata stored alongside other uploads.
 */
export class SpecService {
  /**
   * Create a new Specification entry (backed by FileUploadEntity)
   */
  static async createSpec(data: {
    projectId: string;
    section: string;
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

    return result.data;
  }

  /**
   * Search Specifications in a project (client-side filter for DynamoDB)
   */
  static async searchSpecs(projectId: string, query: string, type: string = 'SPEC') {
    // Scan project files and filter for spec types
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
   * Delete a Specification
   */
  static async deleteSpec(projectId: string, fileId: string) {
    await FileUploadEntity.delete({ projectId, fileId }).go();
  }
}
