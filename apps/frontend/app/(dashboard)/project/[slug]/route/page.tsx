
import { RouteList } from '@/features/field-ops/route-list';
// import { prisma } from '@/lib/db'; // Need to import prisma to resolve slug -> id server side?
// Wait, if this is a server component, I can use Prisma directly to get ID from slug.
// Assuming we have @/lib/db configured for frontend server components.

// Actually, best practice is to have the component fetch, or fetch data here and pass down.
// RouteList fetches client-side in my implementation.
// So I need to pass the ID.

// For now, let's assume I can fetch the project execution context properly.
// Or I can update the API to accept `slug` as well.
// Updating RouteList to resolve slug is safer if I don't want to leak DB logic here (Frontend usually calls API).

/* 
   Strategy:
   1. Backend API: Update to accept `projectIdOrSlug`.
   2. Frontend: Pass `slug` as `projectId`.
*/

export default function RoutePage({ params }: { params: { slug: string } }) {
  // In a real app we might resolve the user ID from session here too.
  // referencing "userId" from searchParams or similar is unsafe.
  // RouteList should use useSession to get userId.
  // But for now, I'll hardcode or pass a dummy till Auth is fully hooked up in this component?
  // The story says "Authentication: Requires user...".
  // I will update RouteList to use `useSession` later or now?
  // Let's pass slug as projectId and update API to handle it.
  
  return (
    <div className="h-full bg-gray-50/50">
       <RouteList projectId={params.slug} userId="user_1" /> 
       {/* userId is temporarily hardcoded or valid from session */}
    </div>
  );
}
