import { OfflineHelpCenter } from '@/features/help-center';

export default function HelpPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Help Center</h1>
      <OfflineHelpCenter />
    </div>
  );
}
