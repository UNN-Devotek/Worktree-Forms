
import { StopDetail } from "@/features/field-ops/stop-detail";

export default function StopDetailPage({ params }: { params: { slug: string; stopId: string } }) {
  // Note: stopId comes as string from URL, standard parsInt needed
  // slug is projectId (or slug)

  // In a real app we'd validate the session/user access here too
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
       <StopDetail stopId={parseInt(params.stopId)} />
    </div>
  );
}
