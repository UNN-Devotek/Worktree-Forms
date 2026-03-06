import { getProject } from "@/features/projects/server/project-actions";
import { getSheetToken } from "@/features/sheets/server/sheet-actions";
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
  // Note: FormEntity schema doesn't have targetSheetId; adapt as needed
  let sheetToken: string | null = null;

  const user = {
    name: session?.user?.name || "Anonymous",
    color: "#" + Math.floor(Math.random() * 16777215).toString(16),
  };

  return (
    <FormDetailView
      form={{
        id: form.formId,
        slug: form.formId,
        title: form.name,
        is_published: form.status === "PUBLISHED",
        group_id: null,
        form_schema: form.schema as unknown as FormSchema,
        targetSheetId: null,
      }}
      projectSlug={slug}
      projectId={project.projectId}
      sheetToken={sheetToken}
      user={user}
    />
  );
}
