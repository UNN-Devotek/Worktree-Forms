'use client';

import { FormBuilderLayout } from '@/features/forms/components/builder/FormBuilderLayout';
import { useParams } from 'next/navigation';

export default function ProjectFormBuilderPage() {
  const params = useParams();
  // Safe parsing of params
  const formId = params?.formId ? parseInt(Array.isArray(params.formId) ? params.formId[0] : params.formId, 10) : undefined;
  const slug = params?.slug ? (Array.isArray(params.slug) ? params.slug[0] : params.slug) : undefined;

  if (!formId) return <div>Invalid Form ID</div>;

  return (
    <FormBuilderLayout
       formId={formId}
       groupId={1} // TODO: Resolve Group ID from Slug via API lookup
       groupSlug={slug}
    />
  );
}
