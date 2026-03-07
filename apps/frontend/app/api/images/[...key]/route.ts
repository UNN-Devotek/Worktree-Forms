import { NextRequest, NextResponse } from 'next/server'
import { s3, S3_BUCKET } from '@/lib/storage'
import { GetObjectCommand } from '@aws-sdk/client-s3'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key } = await params
  const objectKey = key.join('/')
  try {
    const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: objectKey })
    const s3Response = await s3.send(command)
    const body = s3Response.Body
    if (!body) return NextResponse.json({ error: 'File not found' }, { status: 404 })

    const contentType = s3Response.ContentType ?? 'application/octet-stream'
    // Stream the S3 body through — avoids CORS issues with direct presigned URLs
    const webStream = body.transformToWebStream()
    return new NextResponse(webStream, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
