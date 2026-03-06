import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
  ...(process.env.S3_ENDPOINT && {
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "local",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "local",
    },
  }),
});

export const S3_BUCKET = process.env.S3_BUCKET ?? "worktree-local";

/**
 * Returns a presigned URL for uploading a file directly from the browser.
 * In local dev, rewrites the internal Docker hostname to localhost.
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
  return rewriteForBrowser(url);
}

/**
 * Returns a presigned URL for downloading/viewing a file.
 * In local dev, rewrites the internal Docker hostname to localhost.
 */
export async function getPresignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
  return rewriteForBrowser(url);
}

export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates a placeholder object to establish a project folder prefix in S3.
 */
export async function ensureProjectFolder(projectId: string): Promise<void> {
  const key = `projects/${projectId}/.keep`;
  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: "",
      ContentType: "application/x-directory",
    })
  );
}

/**
 * Rewrites internal Docker hostname in presigned URLs to host-accessible address.
 * Only applies in local dev (when S3_ENDPOINT contains "localstack").
 * Production presigned URLs are returned unchanged.
 */
function rewriteForBrowser(url: string): string {
  const endpoint = process.env.S3_ENDPOINT ?? "";
  if (endpoint.includes("localstack")) {
    return url.replace("http://localstack:4510", "http://localhost:4510");
  }
  return url;
}
