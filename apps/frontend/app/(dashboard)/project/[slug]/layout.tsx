import { getProject } from "@/features/projects/server/project-actions";
import { notFound } from "next/navigation";
import { ProjectTabs } from "@/features/projects/components/project-tabs";
import React from "react";

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: {
    slug: string;
  };
}

export default async function ProjectLayout({ children, params }: ProjectLayoutProps) {
  const project = await getProject(params.slug);

  if (!project) {
    notFound();
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 pt-6 pb-0 bg-background shrink-0 border-b">
         <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
         </div>
         <ProjectTabs slug={project.slug} />
      </div>
      <div className="flex-1 overflow-hidden bg-muted/10">
        {children}
      </div>
    </div>
  );
}
