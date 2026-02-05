'use client';

import React, { useState } from 'react';

interface NocoDBEmbedProps {
  viewId: string;
}

export const NocoDBEmbed: React.FC<NocoDBEmbedProps> = ({ viewId }) => {
  const [loading, setLoading] = useState(true);

  // NocoDB shared view URL format
  const baseUrl = process.env.NEXT_PUBLIC_NOCODB_URL || 'http://localhost:8080';
  const embedUrl = `${baseUrl}/dashboard/#/share/${viewId}`;

  return (
    <div className="relative w-full h-full min-h-[600px] border border-border rounded-md overflow-hidden bg-background shadow-sm">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground font-medium">Loading NocoDB Spreadsheet...</p>
        </div>
      )}
      <iframe
        src={embedUrl}
        className="w-full h-full border-none"
        onLoad={() => setLoading(false)}
        allow="clipboard-read; clipboard-write; self"
      />
    </div>
  );
};
