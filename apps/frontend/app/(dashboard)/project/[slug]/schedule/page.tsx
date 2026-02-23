
import { getProject } from "@/features/projects/server/project-actions";
import { notFound } from "next/navigation";
import { ScheduleView } from "@/features/schedule/components/ScheduleView";

export default async function ProjectSchedulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    notFound();
  }

  return (
    <div className="h-full bg-zinc-50/50 dark:bg-black/20">
       <ScheduleView projectId={project.id} />
    </div>
  );
}
