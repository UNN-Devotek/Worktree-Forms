import { getProject } from "@/features/projects/server/project-actions";
import { notFound } from "next/navigation";
import { FormBuilderLayout } from "@/features/forms/components/builder/FormBuilderLayout";

export default async function ProjectNewFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    notFound();
  }

  return (
    <FormBuilderLayout
      groupId={1}
      projectId={project.id}
      projectSlug={slug}
      isNewForm={true}
      formType="general"
      formTitle="Untitled Form"
    />
  );
}
