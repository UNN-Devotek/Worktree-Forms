import { SheetDetailView } from '@/features/sheets/components/grid/SheetDetailView';
import { getSheet, getSheetToken } from '@/features/sheets/server/sheet-actions';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { requireProjectAccessServer } from '@/lib/rbac';
import { ProjectEntity } from '@/lib/dynamo';

export default async function SheetPage({ params }: { params: Promise<{ slug: string; sheetId: string }> }) {
  const { slug, sheetId } = await params;
  const session = await auth();

  // Resolve projectId from slug and verify access BEFORE fetching the sheet.
  // This prevents a timing side-channel where an unauthorized caller could detect
  // sheet existence by observing different redirect paths.
  const projectResult = await ProjectEntity.query.bySlug({ slug }).go();
  const project = projectResult.data[0];
  if (!project) redirect(`/project/${slug}/sheets`);

  try {
    await requireProjectAccessServer(project.projectId, 'VIEWER');
  } catch {
    redirect(`/project/${slug}/sheets`);
  }

  const sheet = await getSheet(sheetId);
  if (!sheet || sheet.projectId !== project.projectId) {
    redirect(`/project/${slug}/sheets`);
  }

  const token = await getSheetToken(sheetId, project.projectId);

  if (!token) {
      redirect(`/project/${slug}/sheets`);
  }

  const userId = session?.user?.id ?? 'anon';
  let colorHash = 0;
  for (let i = 0; i < userId.length; i++) {
    colorHash = userId.charCodeAt(i) + ((colorHash << 5) - colorHash);
  }
  const user = {
    name: session?.user?.name || 'Anonymous',
    color: '#' + (colorHash & 0xffffff).toString(16).padStart(6, '0'),
  };
  
  return (
    <div className="h-full w-full">
        <SheetDetailView
            sheetId={sheetId}
            projectId={sheet.projectId}
            title={sheet.title}
            token={token}
            user={user}
        />
    </div>
  );
}
