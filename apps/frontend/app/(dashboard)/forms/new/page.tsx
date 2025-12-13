'use client';

import { FormBuilderLayout } from '@/components/form-builder/FormBuilderLayout';

export default function NewFormPage() {
  return (
    <FormBuilderLayout
      groupId={1} // Default group for now
      isNewForm={true}
      formType="general"
      formTitle="Untitled Form"
    />
  );
}