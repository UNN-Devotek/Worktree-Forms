import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '../storage.js';
import { prisma } from '../db.js';

export interface FileUploadRecord {
  id: string;
  objectKey: string;
  filename: string;
  contentType: string;
  size: number;
  folder: string;
  uploadedBy: string | null;
  uploadedAt: Date;
}

export class UploadService {
  /**
   * Upload file to S3 and create database record
   * Returns file metadata including object key
   *
   * @param file - Express multer file object
   * @param folder - Organization folder (default: 'uploads')
   * @param uploadedBy - User ID who uploaded the file
   * @returns File upload record with object key
   */
  static async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
    uploadedBy?: string
  ): Promise<FileUploadRecord> {
    console.log(`📤 UploadService: Processing file "${file.originalname}" (${file.size} bytes)`);

    // Generate unique filename using UUID
    const ext = file.originalname.split('.').pop() || 'bin';
    const uniqueFilename = `${uuidv4()}.${ext}`;
    const objectKey = `${folder}/${uniqueFilename}`;

    console.log(`🔑 Generated object key: ${objectKey}`);

    try {
      // Ensure bucket exists
      await StorageService.ensureBucket();

      // Upload to S3
      console.log(`⏳ Uploading to S3...`);
      await StorageService.uploadFile(objectKey, file.buffer, file.mimetype);
      console.log(`✅ File uploaded to S3 successfully`);

      // Create database record
      console.log(`💾 Creating database record...`);
      const fileRecord = await prisma.fileUpload.create({
        data: {
          objectKey,
          filename: file.originalname,
          contentType: file.mimetype,
          size: file.size,
          folder,
          uploadedBy: uploadedBy || null,
        }
      });

      console.log(`✅ Database record created: ${fileRecord.id}`);
      return fileRecord;

    } catch (error) {
      console.error(`❌ UploadService error:`, error);
      throw error;
    }
  }

  /**
   * Upload a pre-processed file with explicit objectKey
   */
  static async uploadFileRaw(
    file: { buffer: Buffer; filename: string; mimetype: string; size: number; objectKey: string },
    uploadedBy?: string,
  ): Promise<FileUploadRecord> {
    await StorageService.ensureBucket();
    await StorageService.uploadFile(file.objectKey, file.buffer, file.mimetype);

    const fileRecord = await prisma.fileUpload.create({
      data: {
        objectKey: file.objectKey,
        filename: file.filename,
        contentType: file.mimetype,
        size: file.size,
        folder: file.objectKey.split('/')[0],
        uploadedBy: uploadedBy || null,
      }
    });

    return fileRecord;
  }

  /**
   * Get file URL from object key
   * Returns backend proxy URL (not presigned URL)
   *
   * @param objectKey - S3 object key (e.g., "form_uploads/abc123.pdf")
   * @returns Full URL for browser access
   */
  static getFileUrl(objectKey: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.FRONTEND_URL || 'http://localhost:3005';
    return `${baseUrl}/api/images/${objectKey}`;
  }

  /**
   * Get file record from database by object key
   *
   * @param objectKey - S3 object key
   * @returns File upload record or null
   */
  static async getFileByObjectKey(objectKey: string): Promise<FileUploadRecord | null> {
    return await prisma.fileUpload.findUnique({
      where: { objectKey }
    });
  }

  /**
   * Delete file from S3 and database
   *
   * @param objectKey - S3 object key to delete
   */
  static async deleteFile(objectKey: string): Promise<void> {
    console.log(`🗑️  Deleting file: ${objectKey}`);

    try {
      // Delete from S3
      await StorageService.deleteFile(objectKey);
      console.log(`✅ File deleted from S3`);

      // Delete from database
      await prisma.fileUpload.delete({
        where: { objectKey }
      });
      console.log(`✅ Database record deleted`);

    } catch (error) {
      console.error(`❌ Error deleting file:`, error);
      throw error;
    }
  }

  /**
   * Associate uploaded files with a form submission
   *
   * @param objectKeys - Array of S3 object keys
   * @param submissionId - Form submission ID
   */
  static async linkFilesToSubmission(objectKeys: string[], submissionId: number): Promise<void> {
    console.log(`🔗 Linking ${objectKeys.length} files to submission ${submissionId}`);

    await prisma.fileUpload.updateMany({
      where: {
        objectKey: {
          in: objectKeys
        }
      },
      data: {
        submissionId
      }
    });

    console.log(`✅ Files linked to submission`);
  }
}
