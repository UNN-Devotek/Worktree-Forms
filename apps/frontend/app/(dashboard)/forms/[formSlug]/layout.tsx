import type { Metadata } from 'next';

/**
 * Server Component layout that provides SEO metadata for dynamic form pages.
 * The page itself is 'use client', so generateMetadata must live here.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ formSlug: string }>;
}): Promise<Metadata> {
  const { formSlug } = await params;
  const title = formSlug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title: `${title} | Worktree`,
    description: 'View and manage this form',
  };
}

export default function FormSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
