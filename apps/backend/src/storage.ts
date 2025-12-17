import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// MinIO endpoint configuration for Docker internal networking
const MINIO_HOST = process.env.MINIO_HOST || 'minio';
const MINIO_PORT = parseInt(process.env.MINIO_PORT || '9004');
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true';

// Public MinIO endpoint for presigned URLs (browsers need to access this)
const MINIO_PUBLIC_URL = process.env.MINIO_PUBLIC_URL || process.env.NEXT_PUBLIC_MINIO_URL || '';

// Construct internal endpoint URL (for S3Client operations)
// Always use HOST:PORT for internal Docker networking
// MINIO_ENDPOINT is deprecated - use MINIO_HOST instead
const internalEndpoint = `${MINIO_USE_SSL ? 'https' : 'http'}://${MINIO_HOST}:${MINIO_PORT}`;

console.log(`📦 MinIO Internal Endpoint: ${internalEndpoint}`);
console.log(`🌐 MinIO Public URL: ${MINIO_PUBLIC_URL || 'Not set (will use internal endpoint)'}`);
console.log(`🪣 MinIO Bucket: ${process.env.MINIO_BUCKET_NAME || 'worktree'}`);

// S3Client for internal operations (upload, delete)
const s3Client = new S3Client({
  region: process.env.MINIO_REGION || 'us-east-1',
  endpoint: internalEndpoint,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'dlb2prui0do1gmry',
  },
  forcePathStyle: true, // Needed for MinIO
});

// S3Client for presigned URLs (must use public endpoint for browser access)
const publicS3Client = MINIO_PUBLIC_URL ? new S3Client({
  region: process.env.MINIO_REGION || 'us-east-1',
  endpoint: MINIO_PUBLIC_URL.startsWith('http') ? MINIO_PUBLIC_URL : `https://${MINIO_PUBLIC_URL}`,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'dlb2prui0do1gmry',
  },
  forcePathStyle: true,
}) : s3Client; // Fallback to internal client if no public URL provided

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'worktree';

export class StorageService {
  
  static async ensureBucket() {
    try {
      // Check if bucket exists
      await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
      console.log(`✅ MinIO bucket '${BUCKET_NAME}' already exists`);
    } catch (error: any) {
      // If bucket doesn't exist, create it
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        try {
          await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
          console.log(`✅ MinIO bucket '${BUCKET_NAME}' created successfully`);
        } catch (createError: any) {
          // Ignore if bucket already exists (race condition)
          if (createError.name !== 'BucketAlreadyOwnedByYou' && createError.name !== 'BucketAlreadyExists') {
            console.error('❌ Failed to create MinIO bucket:', createError);
            throw createError;
          }
          console.log(`✅ MinIO bucket '${BUCKET_NAME}' already exists`);
        }
      } else {
        console.error('❌ Error checking MinIO bucket:', error);
        throw error;
      }
    }
  }

  static async getUploadUrl(key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    // Use publicS3Client for presigned URLs so browsers can access them
    return getSignedUrl(publicS3Client, command, { expiresIn: 3600 });
  }

  static async uploadFile(key: string, body: Buffer | Uint8Array, contentType: string): Promise<void> {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: contentType,
      });
      // Use internal s3Client for direct upload operations
      await s3Client.send(command);
  }

  static async getDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    // Use publicS3Client for presigned URLs so browsers can access them
    return getSignedUrl(publicS3Client, command, { expiresIn: 3600 });
  }

  static async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    await s3Client.send(command);
  }
}
