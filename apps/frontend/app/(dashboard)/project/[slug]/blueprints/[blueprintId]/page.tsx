
// Server Component
import { getProject } from "@/features/projects/server/project-actions";
import { notFound } from "next/navigation";
import { BlueprintViewerClientWrapper } from "./wrapper";

export default async function BlueprintPage({ params }: { params: { slug: string; blueprintId: string } }) {
    // 1. Get Project ID
    const project = await getProject(params.slug);
    if (!project) notFound();
    
    return <BlueprintViewerClientWrapper projectId={project.id} blueprintId={params.blueprintId} projectSlug={params.slug} />;
}
