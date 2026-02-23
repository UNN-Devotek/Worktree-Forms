
import { StopDetail } from "@/features/field-ops/stop-detail";

export default async function StopDetailPage({ params }: { params: Promise<{ slug: string; stopId: string }> }) {
  const { stopId } = await params;
  // Note: stopId comes as string from URL, standard parseInt needed

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
       <StopDetail stopId={parseInt(stopId)} />
    </div>
  );
}
