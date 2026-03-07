'use client';

import { useEffect, useState } from 'react';
import { FormBuilderLayout } from '@/features/forms/components/builder/FormBuilderLayout';
import { useParams, useRouter, useSearchParams, notFound } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { GroupForm } from '@/types/group-forms';
import { ApiResponse } from '@/types/api';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectFormBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const slug = params?.slug ? (Array.isArray(params.slug) ? params.slug[0] : params.slug) : undefined;
  // formId is a nanoid string — do NOT parseInt
  const formId = params?.formId ? (Array.isArray(params.formId) ? params.formId[0] : params.formId) : undefined;
  // projectId is the DynamoDB project ID — passed as query param from FormDetailView
  const projectId = searchParams.get('projectId') ?? slug;

  const [form, setForm] = useState<GroupForm | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!formId || !projectId) {
      setLoading(false);
      return;
    }

    const fetchForm = async () => {
      try {
        // Use the project-scoped forms endpoint which works with DynamoDB FormEntity
        const response = await apiClient<ApiResponse<{ forms: GroupForm[] }>>(
          `/api/projects/${projectId}/forms`
        );
        if (response.success && response.data?.forms) {
          const found = response.data.forms.find((f: any) => (f.formId ?? f.id) === formId);
          if (found) {
            // Normalise to GroupForm shape expected by FormBuilderLayout
            const f = found as GroupForm & { formId?: string; schema?: any; status?: string; name?: string };
            setForm({
              ...f,
              id: f.formId ?? f.id,
              title: f.name ?? f.title,
              slug: f.formId ?? f.slug,
              group_id: null,
              form_schema: f.schema ?? f.form_schema,
              is_published: f.status === 'PUBLISHED',
            } as unknown as GroupForm);
          } else {
            toast.error('Form not found', { description: 'The requested form could not be found.' });
            router.push(`/project/${slug}/forms`);
          }
        }
      } catch (error) {
        console.error('Error fetching form:', error);
        toast.error('Error', { description: 'Failed to load form data.' });
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [formId, projectId, slug, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!formId) {
    notFound();
  }

  if (!form) {
    return null; // redirect to forms list already in flight
  }

  return (
    <FormBuilderLayout
      formId={formId}
      groupId={null}
      groupSlug={slug}
      formTitle={form.name ?? form.title}
      formType={form.form_type}
      initialSchema={form.schema ?? form.form_schema}
      isNewForm={false}
      isSIGRequestForm={form.is_sig_request_form}
      projectSlug={slug}
      projectId={projectId}
      targetSheetId={form.targetSheetId}
    />
  );
}
