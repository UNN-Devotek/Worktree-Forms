import { notFound } from 'next/navigation';
import { getProject } from '@/features/projects/server/project-actions';
import { RouteList } from '@/features/field-ops/route-list';

export default async function RoutePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) notFound();

  return (
    <div className="h-full bg-gray-50/50">
      <RouteList projectId={project.id} projectSlug={slug} />
    </div>
  );
}
