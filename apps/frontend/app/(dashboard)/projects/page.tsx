import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getProjects } from '@/features/projects/server/project-actions';
import { ProjectList } from '@/features/projects/components/project-list';

export const metadata = {
  title: 'Projects - Worktree',
};

export default async function ProjectsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const projects = await getProjects();

  return (
    <div className="flex flex-col space-y-8 p-8 pt-6">
       <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
              <p className="text-muted-foreground">
                Manage all your active projects.
              </p>
            </div>
       </div>

       <div className="space-y-4">
          <ProjectList initialProjects={projects} />
       </div>
    </div>
  );
}
