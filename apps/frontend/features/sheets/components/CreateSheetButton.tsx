'use client';

import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createSheet } from '@/features/sheets/server/sheet-actions-nocodb';
import { toast } from 'sonner';

interface CreateSheetButtonProps {
  projectId: string;
  projectSlug: string;
}

export function CreateSheetButton({ projectId, projectSlug }: CreateSheetButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleCreate = () => {
    startTransition(async () => {
      try {
        const sheet = await createSheet(projectId, `Sheet ${new Date().toLocaleDateString()}`);
        if (sheet) {
          toast.success('Sheet created');
          router.push(`/project/${projectSlug}/sheets/${sheet.id}`);
        } else {
            toast.error('Failed to create sheet');
        }
      } catch (error) {
        console.error('Create sheet error:', error);
        toast.error('Something went wrong');
      }
    });
  };

  return (
    <Button onClick={handleCreate} disabled={isPending}>
      {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
          <Plus className="mr-2 h-4 w-4" />
      )}
      New Sheet
    </Button>
  );
}
