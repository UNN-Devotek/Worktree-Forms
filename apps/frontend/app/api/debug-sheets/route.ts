import { NextResponse } from 'next/server';
import { SheetEntity } from '@/lib/dynamo';

export async function GET() {
  try {
    // Debug route: scan all sheets (not project-scoped, dev-only)
    // Note: In DynamoDB, a full scan is expensive. This is for debug only.
    const result = await SheetEntity.scan.go();
    const safeSheets = result.data.map((s) => ({
      id: s.sheetId,
      projectId: s.projectId,
      name: s.name,
    }));
    return NextResponse.json(safeSheets);
  } catch (error) {
    console.error('Debug Sheets Error:', error);
    return NextResponse.json({ error: String(error), stack: (error as Error).stack }, { status: 200 });
  }
}
