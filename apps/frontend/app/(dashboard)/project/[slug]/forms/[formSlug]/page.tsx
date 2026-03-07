import { getProject } from "@/features/projects/server/project-actions";

import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { FormEntity } from "@/lib/dynamo";
import { FormDetailView } from "@/features/forms/components/FormDetailView";
import type { FormSchema } from "@/types/group-forms";

export default async function ProjectFormDetailPage({
  params,
}: {
  params: Promise<{ slug: string; formSlug: string }>;
}) {
  const { slug, formSlug } = await params;
  const session = await auth();

  const project = await getProject(slug);
  if (!project) notFound();

  // Fetch all forms for the project and find by name/slug match
  // Note: FormEntity uses formId as key, not slug. We scan by project and match.
  const formsResult = await FormEntity.query.byProject({ projectId: project.projectId }).go();
  const form = formsResult.data.find((f) => f.formId === formSlug || f.name === formSlug);
  if (!form) notFound();

  // Get sheet token if the form has a linked sheet
  const sheetToken: string | null = null;

  const userId = session?.user?.id ?? "anon";
  let colorHash = 0;
  for (let i = 0; i < userId.length; i++) {
    colorHash = userId.charCodeAt(i) + ((colorHash << 5) - colorHash);
  }
  const user = {
    name: session?.user?.name || "Anonymous",
    color: "#" + (colorHash & 0xffffff).toString(16).padStart(6, "0"),
  };

  return (
    <FormDetailView
      form={{
        id: form.formId,
        slug: form.formId,
        title: form.name,
        is_published: form.status === "PUBLISHED",
        group_id: project.projectId,
        projectId: project.projectId,
        form_schema: form.schema as unknown as FormSchema,
        targetSheetId: form.targetSheetId ?? null,
      }}
      projectSlug={slug}
      projectId={project.projectId}
      sheetToken={sheetToken}
      user={user}
    />
  );
}
