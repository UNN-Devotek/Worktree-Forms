import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// MinIO endpoint configuration for Docker internal networking
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || '';
const MINIO_HOST = process.env.MINIO_HOST || 'minio';
const MINIO_PORT = parseInt(process.env.MINIO_PORT || '9004'); // Changed from 9000 to 9004
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true';

// Construct endpoint URL
// Priority: MINIO_ENDPOINT > constructed URL from HOST:PORT
let endpoint: string;
if (MINIO_ENDPOINT) {
  // If MINIO_ENDPOINT is provided, use it as-is or add protocol
  endpoint = MINIO_ENDPOINT.startsWith('http')
    ? MINIO_ENDPOINT
    : `${MINIO_USE_SSL ? 'https' : 'http'}://${MINIO_ENDPOINT}`;
} else {
  // Otherwise construct from HOST and PORT (internal Docker networking)
  endpoint = `${MINIO_USE_SSL ? 'https' : 'http'}://${MINIO_HOST}:${MINIO_PORT}`;
}

const s3Client = new S3Client({
  region: process.env.MINIO_REGION || 'us-east-1',
  endpoint,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'dlb2prui0do1gmry',
  },
  forcePathStyle: true, // Needed for Minio
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'squidhub-uploads';

export class StorageService {
  
  static async ensureBucket() {
    // In production/deployment, bucket creation is usually handled by terraform/setup scripts.
    // For this transition, we might assume the bucket exists or we could check and create.
    // We'll skip auto-creation to keep it simple and focused on usage, assuming setup or manual creation.
    // If needed: await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
  }

  static async getUploadUrl(key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });
    
    return getSignedUrl(s3Client, command, { expiresIn: 3600 });
  }

  static async uploadFile(key: string, body: Buffer | Uint8Array, contentType: string): Promise<void> {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: contentType,
      });
      await s3Client.send(command);
  }
  
  static async getDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    return getSignedUrl(s3Client, command, { expiresIn: 3600 });
  }

  static async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    await s3Client.send(command);
  }
}
