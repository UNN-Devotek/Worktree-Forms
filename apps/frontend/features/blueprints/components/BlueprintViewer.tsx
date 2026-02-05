
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface BlueprintViewerProps {
    fileUrl: string;
    title: string;
    onBack: () => void;
}

export const BlueprintViewer: React.FC<BlueprintViewerProps> = ({ fileUrl, title, onBack }) => {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div className="absolute inset-0 z-50 bg-white dark:bg-zinc-950 flex flex-col">
             {/* Toolbar */}
            <div className="h-14 border-b flex items-center px-4 justify-between bg-white dark:bg-zinc-950 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="font-semibold text-sm md:text-base truncate max-w-[200px] md:max-w-md">{title}</h1>
                </div>
                <div className="flex items-center gap-2">
                   {/* Native PDF viewers handle zoom well, but we can add controls if using a library later */}
                   <span className="text-xs text-muted-foreground mr-2 hidden md:inline">Native PDF Viewer Active</span>
                </div>
            </div>

            {/* Viewer Content */}
            <div className="flex-1 relative bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Loading Blueprint...</p>
                        </div>
                    </div>
                )}
                <iframe 
                    src={`${fileUrl}#toolbar=1&view=FitH`} 
                    className="w-full h-full border-none"
                    onLoad={() => setIsLoading(false)}
                    title={title}
                />
            </div>
        </div>
    );
};
