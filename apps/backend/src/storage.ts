import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  CopyObjectCommand,
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

/** @deprecated Use named import `s3` instead. Kept for backward compatibility. */
export const s3Client = s3;

export const S3_BUCKET = process.env.S3_BUCKET ?? "worktree-local";

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

export class StorageService {
  static async ensureBucket(): Promise<void> {
    console.log(`Checking if bucket '${S3_BUCKET}' exists...`);
    try {
      await s3.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
      console.log(`S3 bucket '${S3_BUCKET}' already exists`);
    } catch (error: unknown) {
      const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
      if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
        try {
          console.log(`Creating bucket '${S3_BUCKET}'...`);
          await s3.send(new CreateBucketCommand({ Bucket: S3_BUCKET }));
          console.log(`S3 bucket '${S3_BUCKET}' created successfully`);
        } catch (createError: unknown) {
          const ce = createError as { name?: string };
          if (
            ce.name !== "BucketAlreadyOwnedByYou" &&
            ce.name !== "BucketAlreadyExists"
          ) {
            console.error("Failed to create S3 bucket:", createError);
            throw createError;
          }
          console.log(`S3 bucket '${S3_BUCKET}' already exists`);
        }
      } else {
        console.error("Error checking S3 bucket:", error);
        throw error;
      }
    }
  }

  static async getUploadUrl(key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: contentType,
    });
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return rewriteForBrowser(url);
  }

  static async uploadFile(
    key: string,
    body: Buffer | Uint8Array,
    contentType: string
  ): Promise<void> {
    console.log(`Uploading file to S3: ${key} (${contentType})`);
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    });
    await s3.send(command);
    console.log(`File uploaded successfully: ${key}`);
  }

  static async getDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return rewriteForBrowser(url);
  }

  static async deleteFile(key: string): Promise<void> {
    await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
  }

  /** Download an object from S3 and return its content as a Buffer. */
  static async getObject(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
    const response = await s3.send(command);
    const stream = response.Body as NodeJS.ReadableStream;
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", reject);
    });
  }

  /** Copy an object within the same bucket (used for file renaming). */
  static async copyObject(sourceKey: string, destKey: string): Promise<void> {
    const command = new CopyObjectCommand({
      Bucket: S3_BUCKET,
      CopySource: `${S3_BUCKET}/${sourceKey}`,
      Key: destKey,
    });
    await s3.send(command);
  }
}
