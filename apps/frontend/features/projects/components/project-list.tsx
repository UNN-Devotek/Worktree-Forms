"use client";

import { useState } from "react";
import { Search, FolderOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectCard } from "./project-card";
import { CreateProjectDialog } from "./create-project-dialog";

interface ProjectListProps {
  initialProjects: any[]; // Typed from getProjects
}

export function ProjectList({ initialProjects }: ProjectListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProjects = (initialProjects || []).filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <CreateProjectDialog />
      </div>

      {/* Grid or Empty State */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={searchTerm ? "No projects found" : "No projects yet"}
          description={
            searchTerm
              ? `No projects match "${searchTerm}"`
              : "Get started by creating your first project."
          }
          action={!searchTerm && <CreateProjectDialog />}
          className="mt-8"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
