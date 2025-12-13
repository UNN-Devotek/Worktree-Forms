import { GroupForm } from '@/types/group-forms'
import { FormRenderer } from '@/components/form-renderer/FormRenderer'
import { CheckCircle2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface FormSubmitViewProps {
  form: GroupForm
}

export function FormSubmitView({ form }: FormSubmitViewProps) {
  const [submissionId, setSubmissionId] = useState<number | null>(null)

  const handleSuccess = (id: number) => {
    setSubmissionId(id)
  }

  if (submissionId) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center h-full">
            <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Submission Received</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
                Your response has been recorded successfully.
            </p>
            <Button onClick={() => setSubmissionId(null)} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Submit Another Response
            </Button>
        </div>
    )
  }

  return (
      <div className="max-w-4xl mx-auto py-6">
         <FormRenderer
           formSchema={form.form_schema}
           formId={form.id}
           groupId={1} // TODO: Pass actual group ID when available in context or props, defaulting to 1 as per page.tsx
           onSuccess={handleSuccess}
         />
      </div>
  )
}
