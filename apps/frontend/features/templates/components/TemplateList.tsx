'use client';

import React from 'react';

export function TemplateList() {
    return (
        <div className="p-4 border rounded bg-muted/10">
            <h2 className="text-lg font-semibold mb-2">Project Templates</h2>
            <p className="text-muted-foreground text-sm">
                No templates available. Create a template from an existing project to standardize your workflow.
            </p>
        </div>
    );
}
