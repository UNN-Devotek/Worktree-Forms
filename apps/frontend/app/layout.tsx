import React from 'react';
import type { Metadata } from 'next';
import { Providers } from './providers';
import '@/styles/globals.css';
import { CommandPalette } from '@/components/command-palette';

export const metadata: Metadata = {
  title: 'Worktree',
  description: 'Smart project management platform',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded"
        >
          Skip to content
        </a>
        <Providers>
           <CommandPalette />
           <main id="main-content">
             {children}
           </main>
        </Providers>
      </body>
    </html>
  );
}
