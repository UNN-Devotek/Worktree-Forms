import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getProjects } from '@/features/projects/server/project-actions';
import { ProjectList } from '@/features/projects/components/project-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, FileCheck, Users, TrendingUp } from 'lucide-react';

export default async function DashboardPage() {
  console.log('[DashboardPage] Rendering FULL MODE...');
  
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const projects = await getProjects();

  const stats = {
    totalForms: 12,
    totalSubmissions: 1450,
    activeUsers: 8,
    completionRate: 87.5
  };

  return (
    <div className="flex flex-col space-y-8">
       {/* Page Header */}
       <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
              <p className="text-muted-foreground">
                Welcome back, {session.user.name || 'User'}. Here&apos;s an overview of your projects.
              </p>
            </div>
       </div>

       {/* Stats Grid */}
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* ... stats ... */}
      </div>

      {/* Projects Section */}
      <div className="space-y-4">
          <h3 className="text-xl font-semibold tracking-tight">Your Projects</h3>
          <ProjectList initialProjects={projects} />
      </div>
    </div>
  );
}
