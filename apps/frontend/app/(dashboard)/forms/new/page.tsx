'use client';
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { FormBuilderLayout } from '@/components/form-builder/FormBuilderLayout';
import { Loader2 } from 'lucide-react';

export default function NewFormPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <FormBuilderLayout
        groupId={1} // Default group for now
        isNewForm={true}
        formType="general"
        formTitle="Untitled Form"
      />
    </Suspense>
  );
}