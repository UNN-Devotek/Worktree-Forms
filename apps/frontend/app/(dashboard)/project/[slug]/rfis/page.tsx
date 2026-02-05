
import { getProject } from "@/features/projects/server/project-actions";
import { notFound } from "next/navigation";
import { RfiList } from "@/features/rfi/components/RfiList";

export default async function ProjectRfisPage({ params }: { params: { slug: string } }) {
  const project = await getProject(params.slug);

  if (!project) {
    notFound();
  }

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
       <RfiList projectId={project.id} />
    </div>
  );
}
