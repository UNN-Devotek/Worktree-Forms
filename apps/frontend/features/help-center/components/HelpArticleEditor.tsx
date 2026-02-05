'use client';

import React from 'react';

interface HelpArticleEditorProps {
  initialContent?: any;
  onSave: (content: any) => void;
  onCancel: () => void;
}

export function HelpArticleEditor({ initialContent, onSave, onCancel }: HelpArticleEditorProps) {
  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold">Editor Unavailable</h3>
      <p className="text-muted-foreground">The rich text editor is currently being updated. Please try again later.</p>
      <div className="flex gap-2 mt-4">
        <button onClick={() => onSave(initialContent)} className="btn btn-primary">
            Save (As Is)
        </button>
        <button onClick={onCancel} className="btn btn-secondary">
            Cancel
        </button>
      </div>
    </div>
  );
}
