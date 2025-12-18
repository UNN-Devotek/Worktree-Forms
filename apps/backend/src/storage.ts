import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NodeHttpHandler } from '@smithy/node-http-handler';

// MinIO endpoint configuration
const MINIO_HOST = process.env.MINIO_HOST || 'minio';
const MINIO_PORT = parseInt(process.env.MINIO_PORT || '9004');
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true';

// Public MinIO endpoint for presigned URLs and external access
const MINIO_PUBLIC_URL = process.env.MINIO_PUBLIC_URL || process.env.NEXT_PUBLIC_MINIO_URL || '';

// Determine endpoint: prioritize MINIO_HOST for internal networking
let endpoint: string;
let useExternalEndpoint = false;

if (MINIO_HOST && MINIO_HOST !== 'undefined' && MINIO_HOST !== '') {
  // Use internal Docker networking (MINIO_HOST is set)
  endpoint = `${MINIO_USE_SSL ? 'https' : 'http'}://${MINIO_HOST}:${MINIO_PORT}`;
  console.log(`📦 Using Internal MinIO Endpoint: ${endpoint}`);
} else if (MINIO_PUBLIC_URL) {
  // Fallback to external endpoint
  endpoint = MINIO_PUBLIC_URL.startsWith('http') ? MINIO_PUBLIC_URL : `https://${MINIO_PUBLIC_URL}`;
  useExternalEndpoint = true;
  console.log(`🌐 Using External MinIO Endpoint: ${endpoint}`);
} else {
  // Default fallback
  endpoint = 'http://minio:9000';
  console.log(`📦 Using Default MinIO Endpoint: ${endpoint}`);
}

console.log(`🪣 MinIO Bucket: ${process.env.MINIO_BUCKET_NAME || 'worktree'}`);

// S3Client configuration
// Use longer timeout for external endpoints (30s), shorter for internal (10s)
const requestTimeout = useExternalEndpoint ? 30000 : 10000;

const s3Client = new S3Client({
  region: process.env.MINIO_REGION || 'us-east-1',
  endpoint: endpoint,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'dlb2prui0do1gmry',
  },
  forcePathStyle: true, // Needed for MinIO
  requestHandler: new NodeHttpHandler({
    requestTimeout: requestTimeout,
    connectionTimeout: 10000,
  }),
});

// Use same client for presigned URLs when using external endpoint
// When using internal endpoint, create separate client with public URL for presigned URLs
const publicS3Client = (!useExternalEndpoint && MINIO_PUBLIC_URL) ? new S3Client({
  region: process.env.MINIO_REGION || 'us-east-1',
  endpoint: MINIO_PUBLIC_URL.startsWith('http') ? MINIO_PUBLIC_URL : `https://${MINIO_PUBLIC_URL}`,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'dlb2prui0do1gmry',
  },
  forcePathStyle: true,
  requestHandler: new NodeHttpHandler({
    requestTimeout: 30000,
    connectionTimeout: 10000,
  }),
}) : s3Client; // Use same client for external endpoint or if no public URL

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'worktree';

export class StorageService {
  
  static async ensureBucket() {
    console.log(`🔍 Checking if bucket '${BUCKET_NAME}' exists...`);
    try {
      // Check if bucket exists
      await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
      console.log(`✅ MinIO bucket '${BUCKET_NAME}' already exists`);
    } catch (error: any) {
      console.log(`📝 Bucket check failed: ${error.name || error.message}`);
      // If bucket doesn't exist, create it
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        try {
          console.log(`🏗️  Creating bucket '${BUCKET_NAME}'...`);
          await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
          console.log(`✅ MinIO bucket '${BUCKET_NAME}' created successfully`);
        } catch (createError: any) {
          // Ignore if bucket already exists (race condition)
          if (createError.name !== 'BucketAlreadyOwnedByYou' && createError.name !== 'BucketAlreadyExists') {
            console.error('❌ Failed to create MinIO bucket:', createError.message);
            throw createError;
          }
          console.log(`✅ MinIO bucket '${BUCKET_NAME}' already exists`);
        }
      } else {
        console.error('❌ Error checking MinIO bucket:', error.name, error.message);
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
      console.log(`📤 Uploading file to MinIO: ${key} (${contentType})`);
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: contentType,
      });
      // Use internal s3Client for direct upload operations
      await s3Client.send(command);
      console.log(`✅ File uploaded successfully: ${key}`);
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
