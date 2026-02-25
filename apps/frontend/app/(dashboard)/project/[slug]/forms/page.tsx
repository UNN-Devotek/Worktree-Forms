import { getProject } from "@/features/projects/server/project-actions";
import { notFound } from "next/navigation";
import { ProjectFormBrowser } from "@/features/forms/components/ProjectFormBrowser";

export default async function ProjectFormsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    notFound();
  }

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      <ProjectFormBrowser projectId={project.id} projectSlug={project.slug} />
    </div>
  );
}
