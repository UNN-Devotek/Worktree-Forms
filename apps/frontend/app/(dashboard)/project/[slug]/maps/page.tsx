'use client';

import dynamic from 'next/dynamic';
import { type MapProps } from '@/features/maps/components/map-visualizer';
import { useEffect, useState } from 'react';
import { getProjectRoutes, getRouteStops } from '@/features/maps/server/map-actions';
import { useParams } from 'next/navigation';
import { getProject } from '@/features/projects/server/project-actions';

const MapVisualizer = dynamic<MapProps>(() => import('@/features/maps/components/map-visualizer'), {
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center bg-muted">Loading Map Engine...</div>
});

interface RouteStop {
    stopId: string;
    name?: string;
    latitude?: number;
    longitude?: number;
    order?: number;
    status?: string;
}

interface Route {
    routeId: string;
    name: string;
    status?: string;
    scheduledDate?: string;
}

export default function ProjectMapPage() {
    const params = useParams<{ slug: string }>();
    const [routes, setRoutes] = useState<Route[]>([]);
    const [activeRoute, setActiveRoute] = useState<Route | null>(null);
    const [stops, setStops] = useState<RouteStop[]>([]);
    const [projectId, setProjectId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Resolve projectId from slug via server action
    useEffect(() => {
        async function resolveProject() {
            try {
                const project = await getProject(params.slug);
                if (project) {
                    setProjectId(project.id);
                }
            } catch (err) {
                console.error('Failed to resolve project:', err);
            }
        }
        if (params.slug) resolveProject();
    }, [params.slug]);

    useEffect(() => {
        if (!projectId) return;
        async function loadRoutes() {
            setLoading(true);
            try {
                const data = await getProjectRoutes(projectId!);
                setRoutes(data as Route[]);
                if (data.length > 0) {
                    setActiveRoute(data[0] as Route);
                }
            } catch (err) {
                console.error('Failed to load routes:', err);
            } finally {
                setLoading(false);
            }
        }
        loadRoutes();
    }, [projectId]);

    useEffect(() => {
        if (!projectId || !activeRoute) return;
        async function loadStops() {
            try {
                const data = await getRouteStops(projectId!, activeRoute!.routeId);
                setStops(data as RouteStop[]);
            } catch (err) {
                console.error('Failed to load stops:', err);
            }
        }
        loadStops();
    }, [projectId, activeRoute]);

    // Determine the primary stop to display (first stop with coordinates)
    const primaryStop = stops
        .filter((s) => s.latitude !== undefined && s.longitude !== undefined)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0];

    const stopLocation = primaryStop
        ? { lat: primaryStop.latitude!, lng: primaryStop.longitude!, title: primaryStop.name ?? 'Stop' }
        : { lat: 39.5296, lng: -119.8138, title: activeRoute?.name ?? 'Project Center' };

    return (
        <div className="h-[calc(100vh-4rem)] w-full relative">
            <MapVisualizer
                userLocation={{ lat: 39.5296, lng: -119.8138 }}
                stopLocation={stopLocation}
                geofenceRadius={200}
            />

            {/* Dispatch overlay */}
            <div className="absolute top-4 left-4 z-10 bg-background/90 p-3 rounded shadow backdrop-blur-sm min-w-[200px]">
                <h2 className="font-semibold text-sm mb-1">Dispatch Map</h2>
                {loading ? (
                    <p className="text-xs text-muted-foreground">Loading routes...</p>
                ) : routes.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No routes assigned</p>
                ) : (
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground mb-2">{routes.length} route(s)</p>
                        {routes.map((route) => (
                            <button
                                key={route.routeId}
                                type="button"
                                onClick={() => setActiveRoute(route)}
                                className={`w-full text-left text-xs px-2 py-1 rounded transition-colors ${
                                    activeRoute?.routeId === route.routeId
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-muted'
                                }`}
                            >
                                {route.name}
                            </button>
                        ))}
                        {activeRoute && (
                            <p className="text-xs text-muted-foreground pt-1">
                                {stops.length} stop(s)
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
