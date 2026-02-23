import { SheetDetailView } from '@/features/sheets/components/grid/SheetDetailView';
import { getSheet, getSheetToken } from '@/features/sheets/server/sheet-actions';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function SheetPage({ params }: { params: Promise<{ slug: string; sheetId: string }> }) {
  const { slug, sheetId } = await params;
  const session = await auth();
  const sheet = await getSheet(sheetId);
  const token = await getSheetToken(sheetId);

  if (!sheet || !token) {
      redirect(`/project/${slug}/sheets`);
  }

  const user = {
    name: session?.user?.name || 'Anonymous',
    color: '#' + Math.floor(Math.random()*16777215).toString(16)
  };
  
  return (
    <div className="h-full w-full">
        <SheetDetailView 
            sheetId={sheetId}
            title={sheet.title}
            token={token}
            user={user}
        />
    </div>
  );
}
