'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, CheckCircle, Play, AlertCircle, Phone, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGeolocation, getDistance } from '@/hooks/use-geolocation';
import dynamic from 'next/dynamic';
import { type MapProps } from '@/features/maps/components/map-visualizer'; 
import { useState, useEffect } from "react";
import { Compass, calculateBearing } from '@/features/field-ops/components/compass'; // Assumed safe based on previous checks
import { toast } from "sonner";

const MapVisualizer = dynamic<MapProps>(() => import('@/features/maps/components/map-visualizer'), { 
    ssr: false,
    loading: () => <div className="h-48 bg-muted animate-pulse rounded-lg flex items-center justify-center">Loading Map...</div>
});

// Strict Type Definition
interface FormRef { id: number; title: string; }
interface ProjectRef { id: string; name: string; description?: string; slug: string; }
interface RouteRef { date: string; project: ProjectRef; assignee?: { name: string; email: string; image?: string }; }

interface RouteStop {
  id: number;
  title: string;
  address: string;
  status: 'pending' | 'en-route' | 'arrived' | 'in-progress' | 'completed' | 'skipped' | 'cancelled';
  priority: string;
  order: number;
  latitude?: number;
  longitude?: number;
  scheduledAt?: string;
  form?: FormRef;
  route?: RouteRef;
  contactBox?: { name: string; phone: string }; // New field for Call Button
}

export function StopDetail({ stopId }: { stopId: number }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { coordinates: userLoc, error: geoError } = useGeolocation();
  const [distance, setDistance] = useState<number | null>(null);
  const [inGeofence, setInGeofence] = useState(false);

  const { data: stop, isLoading, error } = useQuery({
      queryKey: ['stop', stopId],
      queryFn: async () => {
          const res = await fetch(`/api/routes/stops/${stopId}`);
          if (!res.ok) throw new Error('Failed to fetch stop');
          const json = await res.json();
          return json.data.stop as RouteStop;
      }
  });

  const updateStatusMutation = useMutation({
      mutationFn: async (newStatus: string) => {
          const locationPayload = userLoc ? { lat: userLoc.lat, lng: userLoc.lng } : undefined;
          const res = await fetch(`/api/routes/stops/${stopId}/status`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: newStatus, location: locationPayload })
          });
          if (!res.ok) throw new Error('Update failed');
          return await res.json();
      },
      onSuccess: (data) => {
          queryClient.setQueryData(['stop', stopId], data.data.stop);
          queryClient.invalidateQueries({ queryKey: ['daily-route'] });
          toast.success("Status updated");
      },
      onError: () => {
          toast.error("Failed to update status");
      }
  });

  useEffect(() => {
      if (userLoc && stop && stop.latitude && stop.longitude) {
          const d = getDistance(userLoc.lat, userLoc.lng, stop.latitude, stop.longitude);
          setDistance(Math.round(d));

          if (d < 200 && (stop.status === 'pending' || stop.status === 'en-route')) {
              setInGeofence(true);
          } else {
              setInGeofence(false);
          }
      }
  }, [userLoc, stop]);

  if (isLoading) return <div className="h-screen flex items-center justify-center text-muted-foreground">Loading details...</div>;
  if (error || !stop) return <div className="h-screen flex items-center justify-center text-destructive">Stop not found.</div>;

  const targetBearing = (userLoc && stop.latitude && stop.longitude) 
      ? calculateBearing(userLoc.lat, userLoc.lng, stop.latitude, stop.longitude)
      : undefined;

  const handleCall = () => {
       if (stop.contactBox?.phone) {
           window.location.href = `tel:${stop.contactBox.phone}`;
       } else {
           // Fallback demo number if not provided
           window.location.href = `tel:555-0199`;
       }
  };

  const stopLoc = stop.latitude && stop.longitude
      ? { lat: stop.latitude, lng: stop.longitude, title: stop.title }
      : { lat: 39.5296, lng: -119.8138, title: stop.title }; // Fallback

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden bg-background">
         {/* Layer 0: Map Background */}
         <div className="absolute inset-0 z-0">
             <MapVisualizer
                stopLocation={stopLoc}
                userLocation={userLoc}
                geofenceRadius={200}
             />
         </div>

         {/* Layer 1: Top Navigation */}
         <div className="absolute top-4 left-4 z-10">
            <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => router.back()} 
                className="shadow-md bg-background/90 backdrop-blur-sm border-border hover:bg-background gap-1"
            >
                <ArrowLeft className="h-4 w-4" /> Back
            </Button>
         </div>

         {/* Layer 2: Compass Widget (Improved) */}
         <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end pointer-events-none">
             {distance !== null && inGeofence && (
                   <Badge variant="default" className="bg-green-600 shadow-md animate-pulse py-1 px-3 text-base dark:text-white mb-2 pointer-events-auto">
                       <AlertCircle className="w-4 h-4 mr-2" />
                       Arrived
                   </Badge>
              )}
             
             {stop.status !== 'completed' && stop.status !== 'arrived' && (stop.latitude || stop.longitude) && (
                 <div className="bg-background/80 backdrop-blur rounded-full p-2 shadow-lg pointer-events-auto">
                     <Compass 
                        targetBearing={targetBearing}
                        className="w-20 h-20"
                     />
                     <div className="text-[10px] text-center font-bold text-muted-foreground mt-1 uppercase tracking-tighter">
                         Destination
                     </div>
                 </div>
             )}
         </div>

        {/* Layer 3: Bottom Sheet Card */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
            <Card className="shadow-xl border-t-4 border-t-primary bg-card/95 backdrop-blur-sm">
                <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                        <Badge variant="outline" className="mb-1 text-xs uppercase tracking-wider bg-background">{stop.status}</Badge>
                        {stop.priority === 'high' && <Badge variant="destructive" className="text-xs">High Priority</Badge>}
                    </div>
                    <CardTitle className="text-lg leading-tight">{stop.title}</CardTitle>
                    {stop.route?.project && (
                         <div className="text-sm text-muted-foreground font-medium">
                             {stop.route.project.name}
                         </div>
                    )}
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                     <div className="flex items-start gap-2 text-muted-foreground bg-muted/30 p-2 rounded">
                        <MapPin className="h-4 w-4 mt-1 shrink-0 text-primary" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{stop.address}</p>
                            {distance !== null && <p className="text-xs text-muted-foreground">{distance}m away</p>}
                        </div>
                     </div>

                    <div className="flex gap-2">
                        {/* Status Action Button */}
                        <div className="flex-1">
                             <StatusActionButton stop={stop} distance={distance} inGeofence={inGeofence} updating={updateStatusMutation.isPending} onUpdate={updateStatusMutation.mutate} onNavigate={(path: string) => router.push(path)} />
                        </div>
                        
                        {/* Call Button (New) */}
                        <Button variant="outline" size="icon" className="h-12 w-12 shrink-0 border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100" onClick={handleCall}>
                            <Phone className="h-5 w-5" />
                        </Button>
                    </div>

                     {geoError && (
                         <p className="text-xs text-destructive bg-destructive/10 p-1 rounded text-center">GPS Error: {geoError.message}</p>
                     )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}

// Extracted for readability
function StatusActionButton({ stop, distance, inGeofence, updating, onUpdate, onNavigate }: any) {
    if (stop.status === 'pending') {
         return (
             <Button className="w-full h-12 text-lg" onClick={() => onUpdate('en-route')} disabled={updating}>
                 <Navigation className="mr-2 h-5 w-5" /> Start Travel
             </Button>
         );
    }
    if (stop.status === 'en-route') {
        return (
             <Button className="w-full h-12 text-lg" variant={inGeofence ? "default" : "secondary"} onClick={() => onUpdate('arrived')} disabled={updating}>
                 <MapPin className="mr-2 h-5 w-5" /> {inGeofence ? "Arrived at Site" : "Mark Arrived"}
             </Button>
        );
    }
    if (stop.status === 'arrived') {
        return (
             <Button className="w-full h-12 text-lg" onClick={async () => {
                  await onUpdate('in-progress'); // optimistic or chained
                  const projectSlug = stop.route?.project?.slug || 'default';
                  onNavigate(`/project/${projectSlug}/route/stop/${stop.id}/perform`);
             }} disabled={updating}>
                 <Play className="mr-2 h-5 w-5" /> Start Job
             </Button>
        );
    }
    if (stop.status === 'in-progress') {
        return (
             <Button className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white" onClick={() => {
                  const projectSlug = stop.route?.project?.slug || 'default';
                  onNavigate(`/project/${projectSlug}/route/stop/${stop.id}/perform`);
             }}>
                 <Play className="mr-2 h-5 w-5" /> Resume Job
             </Button>
        );
    }
    if (stop.status === 'completed') {
        return (
             <Button variant="ghost" className="w-full h-12 text-lg text-green-600 bg-green-50 pointer-events-none">
                 <CheckCircle className="mr-2 h-5 w-5" /> Completed
             </Button>
        );
    }
    return <Button disabled>Unknown Status</Button>;
}
