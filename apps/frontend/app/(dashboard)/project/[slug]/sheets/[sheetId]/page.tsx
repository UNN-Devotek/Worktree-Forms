import { SheetDetailView } from '@/features/sheets/components/grid/SheetDetailView';
import { getSheet, getSheetToken } from '@/features/sheets/server/sheet-actions';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function SheetPage({ params }: { params: { slug: string; sheetId: string } }) {
  const session = await auth();
  const sheet = await getSheet(params.sheetId);
  const token = await getSheetToken(params.sheetId);

  if (!sheet || !token) {
      redirect(`/project/${params.slug}/sheets`);
  }

  const user = {
    name: session?.user?.name || 'Anonymous',
    color: '#' + Math.floor(Math.random()*16777215).toString(16)
  };
  
  return (
    <div className="h-full w-full">
        <SheetDetailView 
            sheetId={params.sheetId} 
            title={sheet.title}
            token={token}
            user={user}
        />
    </div>
  );
}
