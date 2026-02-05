'use client';

import dynamic from 'next/dynamic';
import { type MapProps } from '@/features/maps/components/map-visualizer';

const MapVisualizer = dynamic<MapProps>(() => import('@/features/maps/components/map-visualizer'), {
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center bg-muted">Loading Map Engine...</div>
});

export default function ProjectMapPage() {
    return (
        <div className="h-[calc(100vh-4rem)] w-full relative">
            <MapVisualizer
               userLocation={{ lat: 39.5296, lng: -119.8138 }} // Default center (Reno)
               stopLocation={{ lat: 39.5296, lng: -119.8138, title: 'Project Center' }}
               geofenceRadius={200}
            />
            
            {/* Overlay GUI for Dispatch can go here */}
            <div className="absolute top-4 left-4 z-10 bg-background/90 p-2 rounded shadow backdrop-blur-sm">
                <h2 className="font-semibold text-sm">Dispatch Map</h2>
                <p className="text-xs text-muted-foreground">Viewing active routes</p>
            </div>
        </div>
    );
}
