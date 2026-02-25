
import { getProject } from "@/features/projects/server/project-actions";
import { notFound } from "next/navigation";
import { TaskList } from "@/features/tasks/components/TaskList";

export default async function ProjectTasksPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    notFound();
  }

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
       <TaskList projectId={project.id} />
    </div>
  );
}
