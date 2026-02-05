import { SheetList } from '@/features/sheets/components/SheetList';

export default function SheetsPage({ params }: { params: { slug: string } }) {
  return <SheetList projectSlug={params.slug} />;
}
