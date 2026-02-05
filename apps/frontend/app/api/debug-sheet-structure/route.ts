import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sheetId = searchParams.get('id') || 'cmkomv6t50008i64d1e46fgh9';
  
  try {
    const sheet = await db.sheet.findUnique({
      where: { id: sheetId }
    });
    
    if (!sheet || !sheet.content) {
      return NextResponse.json({ error: 'Sheet not found or empty' });
    }
    
    const jsonString = sheet.content.toString('utf-8');
    const savedData = JSON.parse(jsonString);
    
    const response = {
      sheetId: sheet.id,
      contentSize: sheet.content.length,
      sheetsCount: savedData.length,
      firstSheet: {
        name: savedData[0].name,
        hasData: !!savedData[0].data,
        hasCellData: !!savedData[0].celldata,
        dataType: Array.isArray(savedData[0].data) ? `array[${savedData[0].data?.length}]` : typeof savedData[0].data,
        cellDataType: Array.isArray(savedData[0].celldata) ? `array[${savedData[0].celldata?.length}]` : typeof savedData[0].celldata,
        cellDataSample: savedData[0].celldata?.slice(0, 3) || [],
        dataSample: savedData[0].data?.slice(0, 2)?.map((row: any) => row?.slice(0, 3)) || []
      },
      rawFirstSheet: savedData[0]
    };
    
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: String(error), stack: (error as Error).stack }, { status: 200 });
  }
}
