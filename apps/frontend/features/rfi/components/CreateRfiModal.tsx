'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api';
import { Loader2, Image as ImageIcon, X } from 'lucide-react';
import Image from 'next/image';

interface CreateRfiModalProps {
    projectId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateRfiModal: React.FC<CreateRfiModalProps> = ({ projectId, isOpen, onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [question, setQuestion] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [images, setImages] = useState<{ url: string; objectKey: string }[]>([]);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', file);
            
            const res = await apiClient<{ success: boolean; data: { url: string; objectKey: string } }>(
                `/api/projects/${projectId}/upload`, 
                { method: 'POST', body: formData, isFormData: true }
            );

            if (res.success && res.data) {
                setImages(prev => [...prev, res.data]);
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
        setIsSubmitting(true);
        try {
            const res = await apiClient(`/api/projects/${projectId}/rfis`, {
                method: 'POST',
                body: JSON.stringify({
                    title,
                    question,
                    images
                })
            });
            if (res.success) {
                onSuccess();
                // Reset form
                setTitle('');
                setQuestion('');
                setImages([]);
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
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Create New RFI</h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <Input 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                            placeholder="Brief summary of the issue" 
                            required 
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">Question / Issue</label>
                        <Textarea 
                            value={question} 
                            onChange={e => setQuestion(e.target.value)} 
                            placeholder="Describe the issue in detail..." 
                            required 
                            className="min-h-[100px]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Photos</label>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                             {images.map((img, idx) => (
                                 <div key={idx} className="relative aspect-square rounded-md overflow-hidden border">
                                     <Image src={img.url} alt="RFI Attachment" fill className="object-cover" />
                                     <button 
                                        type="button"
                                        onClick={() => setImages(images.filter((_, i) => i !== idx))}
                                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-red-500"
                                     >
                                        <X className="h-3 w-3" />
                                     </button>
                                 </div>
                             ))}
                             <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                             >
                                 {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImageIcon className="h-6 w-6 text-zinc-400" />}
                                 <span className="text-xs text-zinc-500 mt-1">Add Photo</span>
                             </button>
                        </div>
                        <input 
                            ref={fileInputRef} 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleFileSelect}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting || isUploading}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Create Draft
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
