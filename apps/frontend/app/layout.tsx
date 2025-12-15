import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { SessionProvider } from '@/components/session-provider';
import { Toaster } from '@/components/ui/toaster';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Worktree | Form Management System',
  description: 'Professional form builder with admin panel and audit logging',
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
      <body className="bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            {children}
          </SessionProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
