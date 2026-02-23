
import { getProject } from "@/features/projects/server/project-actions";
import { notFound } from "next/navigation";
import { BlueprintList } from "@/features/blueprints/components/BlueprintList";

export default async function ProjectBlueprintsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    notFound();
  }

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
       <div className="mb-4">
           <h1 className="text-2xl font-bold tracking-tight">Blueprints</h1>
           <p className="text-muted-foreground">View and manage project drawings and blueprints.</p>
       </div>
       <BlueprintList projectId={project.id} projectSlug={project.slug} />
    </div>
  );
}
