import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '../storage.js';
import { FileUploadEntity, ProjectEntity } from '../lib/dynamo/index.js';
import { nanoid } from 'nanoid';

export interface FileUploadRecord {
  fileId: string;
  objectKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  projectId: string;
  uploadedBy: string | null;
  createdAt: string;
  // Aliases for backward compat with route handlers
  id?: string;
  filename?: string;
  contentType?: string;
  size?: number;
  folder?: string;
  uploadedAt?: Date;
}

interface FileUploadData {
  fileId: string;
  objectKey: string;
  originalName?: string;
  mimeType?: string;
  sizeBytes?: number;
  projectId: string;
  uploadedBy?: string;
  createdAt?: string;
}

function toFileUploadRecord(record: FileUploadData, folder: string): FileUploadRecord {
  return {
    fileId: record.fileId,
    objectKey: record.objectKey,
    originalName: record.originalName ?? '',
    mimeType: record.mimeType ?? '',
    sizeBytes: record.sizeBytes ?? 0,
    projectId: record.projectId,
    uploadedBy: record.uploadedBy ?? null,
    createdAt: record.createdAt ?? new Date().toISOString(),
    id: record.fileId,
    filename: record.originalName ?? '',
    contentType: record.mimeType ?? '',
    size: record.sizeBytes ?? 0,
    folder,
    uploadedAt: record.createdAt ? new Date(record.createdAt) : new Date(),
  };
}

export class UploadService {
  /**
   * Upload file to S3 and create database record
   * Returns file metadata including object key
   */
  static async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
    uploadedBy?: string,
    projectId: string = 'global',
  ): Promise<FileUploadRecord> {

    const ext = file.originalname.split('.').pop() || 'bin';
    const uniqueFilename = `${uuidv4()}.${ext}`;
    const objectKey = `${folder}/${uniqueFilename}`;

    try {
      // Quota enforcement: check before uploading
      if (projectId !== 'global') {
        const projectResult = await ProjectEntity.get({ projectId }).go();
        const project = projectResult.data;
        if (project && project.storageQuotaBytes) {
          const used = project.storageUsedBytes ?? 0;
          if (used + file.size > project.storageQuotaBytes) {
            throw new Error('Storage quota exceeded');
          }
        }
      }

      await StorageService.ensureBucket();
      await StorageService.uploadFile(objectKey, file.buffer, file.mimetype);

      const fileId = nanoid();
      const result = await FileUploadEntity.create({
        fileId,
        projectId,
        objectKey,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedBy: uploadedBy || undefined,
      }).go();

      // Update project storage usage after successful upload
      if (projectId !== 'global') {
        try {
          const projectResult = await ProjectEntity.get({ projectId }).go();
          const currentUsed = projectResult.data?.storageUsedBytes ?? 0;
          await ProjectEntity.patch({ projectId })
            .set({ storageUsedBytes: currentUsed + file.size })
            .go();
        } catch (storageUpdateError) {
          console.error('UploadService: Failed to update project storage usage:', storageUpdateError);
        }
      }

      return toFileUploadRecord(result.data, folder);
    } catch (error) {
      console.error('UploadService error:', error);
      throw error;
    }
  }

  /**
   * Upload a pre-processed file with explicit objectKey
   */
  static async uploadFileRaw(
    file: { buffer: Buffer; filename: string; mimetype: string; size: number; objectKey: string },
    uploadedBy?: string,
    projectId: string = 'global',
  ): Promise<FileUploadRecord> {
    await StorageService.ensureBucket();
    await StorageService.uploadFile(file.objectKey, file.buffer, file.mimetype);

    const fileId = nanoid();
    const result = await FileUploadEntity.create({
      fileId,
      projectId,
      objectKey: file.objectKey,
      originalName: file.filename,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      uploadedBy: uploadedBy || undefined,
    }).go();

    return toFileUploadRecord(result.data, file.objectKey.split('/')[0]);
  }

  /**
   * Get file URL from object key
   */
  static getFileUrl(objectKey: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.FRONTEND_URL || 'http://localhost:3005';
    return `${baseUrl}/api/images/${objectKey}`;
  }

  /**
   * Get file record from database by object key (scan-based, not ideal for DynamoDB)
   */
  static async getFileByObjectKey(objectKey: string): Promise<FileUploadRecord | null> {
    const result = await FileUploadEntity.scan
      .where((attr, op) => op.eq(attr.objectKey, objectKey))
      .go();
    const record = result.data[0];
    if (!record) return null;
    return toFileUploadRecord(record, record.objectKey.split('/')[0]);
  }

  /**
   * Delete file from S3 and database
   */
  static async deleteFile(objectKey: string, projectId: string, fileId: string): Promise<void> {
    await StorageService.deleteFile(objectKey);
    await FileUploadEntity.delete({ projectId, fileId }).go();
  }

  /**
   * Link files to a submission (update submissionId on file records)
   */
  static async linkFilesToSubmission(projectId: string, fileIds: string[], submissionId: string): Promise<void> {
    for (const fileId of fileIds) {
      await FileUploadEntity.patch({ projectId, fileId })
        .set({ submissionId })
        .go();
    }
  }
}
