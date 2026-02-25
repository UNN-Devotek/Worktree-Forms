import { getProject } from "@/features/projects/server/project-actions";
import { getSheetToken } from "@/features/sheets/server/sheet-actions";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { db } from "@/lib/database";
import { FormDetailView } from "@/features/forms/components/FormDetailView";

export default async function ProjectFormDetailPage({
  params,
}: {
  params: Promise<{ slug: string; formSlug: string }>;
}) {
  const { slug, formSlug } = await params;
  const session = await auth();

  const project = await getProject(slug);
  if (!project) notFound();

  // Fetch the form by slug
  const form = await db.form.findFirst({
    where: { slug: formSlug, projectId: project.id },
  });
  if (!form) notFound();

  // Get sheet token if the form has a linked sheet
  let sheetToken: string | null = null;
  if (form.targetSheetId) {
    sheetToken = await getSheetToken(form.targetSheetId);
  }

  const user = {
    name: session?.user?.name || "Anonymous",
    color: "#" + Math.floor(Math.random() * 16777215).toString(16),
  };

  return (
    <FormDetailView
      form={{
        id: form.id,
        slug: form.slug,
        title: form.title,
        is_published: form.is_published,
        group_id: form.group_id,
        form_schema: form.form_schema as any,
        targetSheetId: form.targetSheetId ?? null,
      }}
      projectSlug={slug}
      projectId={project.id}
      sheetToken={sheetToken}
      user={user}
    />
  );
}
