import { getProject } from "@/features/projects/server/project-actions";
import { notFound } from "next/navigation";
import { DashboardView } from "@/components/dashboard/DashboardView";

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    notFound();
  }

  return (
    <div className="flex-1 h-full p-6">
        <DashboardView 
            projectId={project.id} 
            projectSlug={project.slug} 
            projectName={project.name} 
        />
    </div>
  );
}
