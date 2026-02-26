import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';

// Initialize S3 Client (Server-Side)
const s3Client = new S3Client({
  region: process.env.MINIO_REGION || 'us-east-1',
  endpoint: 'http://minio:9000', // Internal Docker URL
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'dlb2prui0do1gmry', 
  },
  forcePathStyle: true,
  requestHandler: new NodeHttpHandler({
    connectionTimeout: 10000,
    requestTimeout: 10000,
  }),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');
  const urlParam = searchParams.get('url');

  // Fallback to URL parsing if key not explicit (backward compat or transitional)
  const objectKey = key;
  if (!objectKey && urlParam) {
      // Try to extract key from URL if possible, or just fail. 
      // Given the signature issues, we really want the key.
      return new NextResponse('Key parameter required for robust loading', { status: 400 });
  }

  if (!objectKey) {
      return new NextResponse('Missing key parameter', { status: 400 });
  }

  try {
      const command = new GetObjectCommand({
          Bucket: process.env.MINIO_BUCKET_NAME || 'worktree',
          Key: objectKey,
      });

      const s3Response = await s3Client.send(command);

      if (!s3Response.Body) {
          return new NextResponse('Empty response body', { status: 404 });
      }

      // stream the body
      const transformStream = s3Response.Body.transformToWebStream();
      
      const headers = new Headers();
      headers.set('Content-Type', 'application/pdf');
      if (s3Response.ContentLength) {
        headers.set('Content-Length', s3Response.ContentLength.toString());
      }
      headers.set('Access-Control-Allow-Origin', '*'); 
      headers.set('Cache-Control', 'public, max-age=3600'); 

      return new NextResponse(transformStream, { status: 200, headers });

  } catch (error: any) {
      console.error("S3 Proxy Error:", error);
      return new NextResponse(`Proxy Error: ${error.message}`, { status: 500 });
  }
}
