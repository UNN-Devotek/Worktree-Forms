import { SheetList } from '@/features/sheets/components/SheetList';

export default async function SheetsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SheetList projectSlug={slug} />;
}
