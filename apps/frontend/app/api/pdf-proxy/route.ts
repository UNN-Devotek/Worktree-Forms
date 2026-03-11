import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3, S3_BUCKET } from '@/lib/storage';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const urlParam = searchParams.get("url");

  // Fallback to URL parsing if key not explicit (backward compat or transitional)
  const objectKey = key;
  if (!objectKey && urlParam) {
    return new NextResponse(
      "Key parameter required for robust loading",
      { status: 400 }
    );
  }

  if (!objectKey) {
    return new NextResponse("Missing key parameter", { status: 400 });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: objectKey,
    });

    const s3Response = await s3.send(command);

    if (!s3Response.Body) {
      return new NextResponse("Empty response body", { status: 404 });
    }

    // stream the body
    const transformStream = s3Response.Body.transformToWebStream();

    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    if (s3Response.ContentLength) {
      headers.set("Content-Length", s3Response.ContentLength.toString());
    }
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Cache-Control", "public, max-age=3600");

    return new NextResponse(transformStream, { status: 200, headers });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("S3 Proxy Error:", error);
    return new NextResponse(`Proxy Error: ${message}`, { status: 500 });
  }
}
