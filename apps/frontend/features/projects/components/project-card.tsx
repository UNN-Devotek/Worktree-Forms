import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users } from "lucide-react";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    updatedAt: Date;
    members: { roles: string[] }[];
    _count?: { members: number };
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  // Determine user's role in this project (assuming single user context from queries)
  const myRole = project.members[0]?.roles[0] || "MEMBER";

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle className="text-xl truncate pr-2">{project.name}</CardTitle>
            <Badge variant="outline" className="text-xs shrink-0 capitalize">
                {myRole.toLowerCase()}
            </Badge>
        </div>
        {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-2 h-10">
                {project.description}
            </p>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex items-center text-sm text-muted-foreground gap-4">
             <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{project._count?.members || 1} members</span>
             </div>
             {/* Could add task count here if we had it */}
        </div>
      </CardContent>
      <CardFooter className="pt-4 border-t bg-muted/20">
        <Link 
            href={`/project/${project.slug}`} 
            className="w-full flex items-center justify-between text-sm font-medium hover:underline text-primary"
        >
            Open Project <ArrowRight className="h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  );
}
