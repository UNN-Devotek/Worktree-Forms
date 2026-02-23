
import { getProject } from "@/features/projects/server/project-actions";
import { notFound } from "next/navigation";
import { SpecList } from "@/features/specs/components/SpecList";

export default async function ProjectSpecsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    notFound();
  }

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
       <div className="mb-4">
           <h1 className="text-2xl font-bold tracking-tight">Specifications</h1>
           <p className="text-muted-foreground">Manage and search project specifications.</p>
       </div>
       <SpecList projectId={project.id} />
    </div>
  );
}
