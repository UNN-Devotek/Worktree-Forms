
// Server Component
import { getProject } from "@/features/projects/server/project-actions";
import { notFound } from "next/navigation";
import { BlueprintViewerClientWrapper } from "./wrapper";

export default async function BlueprintPage({ params }: { params: Promise<{ slug: string; blueprintId: string }> }) {
    const { slug, blueprintId } = await params;
    // 1. Get Project ID
    const project = await getProject(slug);
    if (!project) notFound();

    return <BlueprintViewerClientWrapper projectId={project.id} blueprintId={blueprintId} projectSlug={slug} />;
}
