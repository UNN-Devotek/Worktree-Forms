import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Worktree Forms | Form Management System',
  description: 'Professional form builder with admin panel and audit logging',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-neutral-bg text-neutral-text">
        {children}
      </body>
    </html>
  );
}
