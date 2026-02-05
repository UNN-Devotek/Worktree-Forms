import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Initialize S3 Client
export const s3Client = new S3Client({
  region: process.env.MINIO_REGION || "us-east-1",
  endpoint: process.env.MINIO_ENDPOINT || process.env.MINIO_PUBLIC_URL || "http://localhost:9000",
  forcePathStyle: true, // Required for MinIO
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.MINIO_SECRET_KEY || "minioadmin",
  },
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || "worktree";

/**
 * Ensures that the project has a dedicated folder in the storage bucket.
 * Since S3 is flat, we create a 0-byte .keep file at projects/{projectId}/.keep
 */
export async function ensureProjectBucket(projectId: string) {
  const key = `projects/${projectId}/.keep`;

  if (process.env.MOCK_STORAGE === "true") {
      console.log(`[Storage] MOCKING success for project: ${projectId}`);
      return { success: true };
  }

  try {
    // 1. Ensure bucket exists (optional, mostly for dev)
    // In prod, bucket should be pre-created via Terraform/IaC
    // await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));

    // 2. Put the placeholder object
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: "", // Empty content
      ContentType: "application/x-directory", // Suggest folder nature
    });

    await s3Client.send(command);
    console.log(`[Storage] Secured folder for project: ${projectId}`);
    return { success: true };
  } catch (error) {
    console.error(`[Storage] Failed to secure folder for project ${projectId}:`, error);
    // We strictly return error to allow the caller to decide (rollback transaction)
    return { success: false, error };
  }
}
