'use client';

import { useEffect, useState } from 'react';
import { FormBuilderLayout } from '@/features/forms/components/builder/FormBuilderLayout';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { GroupForm } from '@/types/group-forms';
import { ApiResponse } from '@/types/api';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectFormBuilderPage() {
  const params = useParams();
  const router = useRouter();

  const slug = params?.slug ? (Array.isArray(params.slug) ? params.slug[0] : params.slug) : undefined;
  const formIdRaw = params?.formId ? (Array.isArray(params.formId) ? params.formId[0] : params.formId) : undefined;
  const formId = formIdRaw ? parseInt(formIdRaw, 10) : undefined;

  const [form, setForm] = useState<GroupForm | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!formId) {
      setLoading(false);
      return;
    }

    const fetchForm = async () => {
      try {
        const response = await apiClient<ApiResponse<{ form: GroupForm }>>(
          `/api/groups/1/forms/${formId}`
        );
        if (response.success && response.data?.form) {
          setForm(response.data.form);
        } else {
          toast.error('Form not found', { description: 'The requested form could not be found.' });
          router.push(`/project/${slug}/forms`);
        }
      } catch (error) {
        console.error('Error fetching form:', error);
        toast.error('Error', { description: 'Failed to load form data.' });
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [formId, slug, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!formId || !form) {
    return null;
  }

  return (
    <FormBuilderLayout
      formId={formId}
      groupId={form.group_id}
      groupSlug={slug}
      formTitle={form.title}
      formType={form.form_type}
      initialSchema={form.form_schema}
      isNewForm={false}
      isSIGRequestForm={form.is_sig_request_form}
      projectSlug={slug}
      targetSheetId={form.targetSheetId}
    />
  );
}
