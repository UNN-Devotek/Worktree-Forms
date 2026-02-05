
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FormSettings } from '@/types/group-forms'
import { apiClient } from '@/lib/api'
import { Loader2, Trash2, FileText, UploadCloud } from 'lucide-react'

interface BackgroundSettingsProps {
    settings: FormSettings
    onChange: (settings: FormSettings) => void
    projectId?: string 
}

export function BackgroundSettings({ settings, onChange, projectId }: BackgroundSettingsProps) {
    const [isUploading, setIsUploading] = useState(false);
    const backgroundPdfUrl = settings?.backgroundPdfUrl;

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Default project ID if not provided (e.g., from context or prop)
        // For now, let's assume we can upload to a generic 'temp' or use a hardcoded project ID if missing
        // or require projectId.
        // Assuming context provides it or we use a general upload endpoint.
        const pid = projectId || 'shared'; 

        setIsUploading(true);
        try {
             const formData = new FormData();
             formData.append('file', file);
             
             const res = await apiClient<{ success: boolean; data: { url: string; objectKey: string } }>(
                 `/api/projects/${pid}/upload`, 
                 { method: 'POST', body: formData, isFormData: true }
             );

             if (res.success && res.data?.objectKey) {
                 onChange({
                     ...settings,
                     backgroundPdfUrl: res.data.objectKey // Store Key instead of URL for robust proxying
                 });
             }
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemove = () => {
        onChange({
            ...settings,
            backgroundPdfUrl: undefined
        });
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h3 className="text-lg font-medium">Background PDF</h3>
                <p className="text-sm text-muted-foreground">
                    Upload a government form or blueprint to use as a background for overlay mapping.
                </p>
            </div>

            {backgroundPdfUrl ? (
                <div className="flex items-center gap-4 border p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900">
                    <div className="h-12 w-12 rounded bg-red-100 flex items-center justify-center text-red-600">
                        <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <p className="font-medium truncate max-w-[200px]">Background PDF</p>
                        <a href={`/api/pdf-proxy?key=${backgroundPdfUrl}`} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">View File</a>
                    </div>
                    <Button variant="destructive" size="icon" onClick={handleRemove}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer relative">
                    <input 
                        type="file" 
                        accept=".pdf" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={handleUpload} 
                        disabled={isUploading}
                    />
                    {isUploading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : (
                        <UploadCloud className="h-8 w-8 text-muted-foreground" />
                    )}
                    <p className="font-medium">Click to Upload PDF</p>
                    <p className="text-xs text-muted-foreground">Supports PDF files only.</p>
                </div>
            )}
        </div>
    );
}
