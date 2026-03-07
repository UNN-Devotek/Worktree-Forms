import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { getProject } from '@/features/projects/server/project-actions';
import { PersistedChat } from '@/features/sheets/components/PersistedChat';

export default async function ChatPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [session, project] = await Promise.all([auth(), getProject(slug)]);

  if (!project) notFound();

  const currentUser = {
    id: session?.user?.id ?? 'anon',
    name: session?.user?.name ?? 'Anonymous',
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-900 rounded-lg border shadow-sm overflow-hidden">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">Team Chat</h1>
        <p className="text-sm text-muted-foreground">Project communication channel</p>
      </div>
      <div className="flex-1 min-h-0">
        <PersistedChat projectId={project.id} currentUser={currentUser} />
      </div>
    </div>
  );
}
