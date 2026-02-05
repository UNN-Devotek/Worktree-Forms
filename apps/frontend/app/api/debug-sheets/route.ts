import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET() {
  try {
    const sheets = await db.sheet.findMany();
    const safeSheets = sheets.map(s => ({
        id: s.id,
        slug: s.slug || 'no-slug', // Check if slug exists
        projectId: s.projectId,
        contentLen: s.content?.length
    }));
    return NextResponse.json(safeSheets);
  } catch (error) {
    console.error('Debug Sheets Error:', error);
    return NextResponse.json({ error: String(error), stack: (error as Error).stack }, { status: 200 }); // Return 200 to see error in read_url_content
  }
}
