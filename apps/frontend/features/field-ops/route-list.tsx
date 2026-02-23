
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface RouteStop {
  id: number;
  title: string;
  address: string;
  status: string;
  priority: string;
  order: number;
}

interface Route {
  id: number;
  date: string;
  status: string;
  stops: RouteStop[];
}

import { useSession } from 'next-auth/react';

export function RouteList({ projectId, userId, projectSlug }: { projectId?: string; userId?: string; projectSlug?: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const effectiveUserId = userId || session?.user?.id;
  const effectiveProjectId = projectId || projectSlug;

  useEffect(() => {
    async function fetchRoute() {
      if (!effectiveUserId || !effectiveProjectId) return;
      
      try {
        const res = await fetch(`/api/projects/${effectiveProjectId}/routes/my-daily?userId=${effectiveUserId}`);
        if (!res.ok) throw new Error('Failed to fetch route');
        const json = await res.json();
        if (json.success) {
          setRoute(json.data.route);
        } else {
             setRoute(null);
        }
      } catch (err) {
        console.error(err);
        setError('Could not load today\'s route');
      } finally {
        setLoading(false);
      }
    }

    fetchRoute();
  }, [effectiveProjectId, effectiveUserId]);

  if (loading && (!effectiveUserId || !effectiveProjectId)) {
      return <div className="p-4 text-center">Loading session...</div>;
  }

  if (loading) {
    return <div className="p-4 text-center">Loading route...</div>;
  }

  if (error) {
     return (
         <div className="p-4 text-center text-red-500">
             <p>{error}</p>
             <Button variant="outline" onClick={() => window.location.reload()} className="mt-2">Retry</Button>
         </div>
     );
  }

  if (!route || route.stops.length === 0) {
    return (
      <Card className="m-4 text-center py-8">
        <CardContent>
          <div className="flex justify-center mb-4">
            <Calendar className="h-12 w-12 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium">No Route Assigned</h3>
          <p className="text-gray-500 text-sm mt-1">You have no stops scheduled for today.</p>
          <Button variant="outline" className="mt-4">Pull to Refresh</Button>
        </CardContent>
      </Card>
    );
  }

  const completed = route.stops.filter(s => s.status === 'completed').length;
  const total = route.stops.length;
  const progress = Math.round((completed / total) * 100);

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
         <div>
            <h2 className="text-xl font-bold">Today's Route</h2>
            <p className="text-gray-500 text-sm">{format(new Date(route.date), 'EEEE, MMM do')}</p>
         </div>
         <Badge variant={progress === 100 ? 'default' : 'secondary'}>{completed}/{total} Done</Badge>
      </div>

      <div className="space-y-3">
        {route.stops.map((stop) => (
          <Card key={stop.id} className="overflow-hidden border-l-4 border-l-blue-500 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => router.push(`/project/${projectId}/route/stop/${stop.id}`)}>
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                  <Badge variant="outline" className="mb-2 text-xs uppercase tracking-wider">{stop.status}</Badge>
                  {stop.priority === 'high' && <Badge variant="destructive" className="text-xs">High Priority</Badge>}
              </div>
              <CardTitle className="text-lg">{stop.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
               <div className="flex items-start gap-2 text-gray-600 mb-4">
                  <MapPin className="h-4 w-4 mt-1 shrink-0" />
                  <span className="text-sm">{stop.address}</span>
               </div>
               
               <div className="flex gap-2">
                   <Button className="flex-1" size="sm" variant="default" onClick={(e) => { e.stopPropagation(); router.push(`/project/${projectId}/route/stop/${stop.id}`); }}>
                       <Navigation className="h-4 w-4 mr-2" />
                       Navigate
                   </Button>
                   <Button className="flex-1" size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); router.push(`/project/${projectId}/route/stop/${stop.id}`); }}>
                       Details
                   </Button>
               </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
