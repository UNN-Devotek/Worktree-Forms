
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api';
import { Loader2, Upload, FileText, X } from 'lucide-react';

interface BlueprintUploadModalProps {
    projectId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const BlueprintUploadModal: React.FC<BlueprintUploadModalProps> = ({ projectId, isOpen, onClose, onSuccess }) => {
    const [section, setSection] = useState('');
    const [title, setTitle] = useState('');
    const [keywords, setKeywords] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [fileData, setFileData] = useState<{ url: string; objectKey: string; filename: string } | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert('PDF only please'); 
            return;
        }

        try {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', file);
            
            const res = await apiClient<{ success: boolean; data: { url: string; objectKey: string; filename: string } }>(
                `/api/projects/${projectId}/upload`, 
                { method: 'POST', body: formData, isFormData: true }
            );

            if (res.success && res.data) {
                setFileData(res.data);
                if (!title) setTitle(res.data.filename.replace('.pdf', ''));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fileData) return;

        setIsSubmitting(true);
        try {
            const res = await apiClient<{ success: boolean }>(`/api/projects/${projectId}/specs`, {
                method: 'POST',
                body: JSON.stringify({
                    section,
                    title,
                    keywords,
                    type: 'BLUEPRINT',
                    fileUrl: fileData.url,
                    objectKey: fileData.objectKey
                })
            });
            if (res.success) {
                onSuccess();
                setSection('');
                setTitle('');
                setKeywords('');
                setFileData(null);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Upload Blueprint</h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                            <label className="block text-sm font-medium mb-1">Sheet #</label>
                            <Input 
                                value={section} 
                                onChange={e => setSection(e.target.value)} 
                                placeholder="A-101" 
                                required 
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Sheet Title</label>
                            <Input 
                                value={title} 
                                onChange={e => setTitle(e.target.value)} 
                                placeholder="First Floor Plan" 
                                required 
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">Tags (Comma separated)</label>
                        <Input 
                            value={keywords} 
                            onChange={e => setKeywords(e.target.value)} 
                            placeholder="architectural, floor plan..." 
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Blueprint PDF</label>
                        
                        {!fileData ? (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                             >
                                 {isUploading ? <Loader2 className="h-8 w-8 animate-spin text-zinc-400" /> : <Upload className="h-8 w-8 text-zinc-400" />}
                                 <span className="text-sm text-zinc-500 mt-2">Click to Upload PDF</span>
                             </button>
                        ) : (
                            <div className="flex items-center gap-3 p-3 border rounded-md bg-zinc-50 dark:bg-zinc-800">
                                <FileText className="h-6 w-6 text-red-500" />
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-medium truncate">{fileData.filename}</p>
                                    <p className="text-xs text-zinc-500">Ready to save</p>
                                </div>
                                <button type="button" onClick={() => setFileData(null)} className="text-zinc-500 hover:text-red-500">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                        
                        <input 
                            ref={fileInputRef} 
                            type="file" 
                            accept=".pdf" 
                            className="hidden" 
                            onChange={handleFileSelect}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting || !fileData}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Save Blueprint
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
