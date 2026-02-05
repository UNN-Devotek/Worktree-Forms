
'use client';

import { 
    Map, 
    MapMarker, 
    MarkerContent, 
    MarkerPopup, 
    MapControls,
    useMap 
} from '@/components/ui/map';
import { useEffect, useId } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import type { Map as MapType } from 'maplibre-gl';

export interface MapProps {
    stopLocation: { lat: number; lng: number; title: string };
    userLocation: { lat: number; lng: number } | null;
    geofenceRadius?: number; // meters
}

// Helper to create a GeoJSON Circle
function createGeoJSONCircle(center: { lat: number, lng: number }, radiusInMeters: number, points = 64) {
    const coords = {
        latitude: center.lat,
        longitude: center.lng
    };
    const km = radiusInMeters / 1000;
    const ret = [];
    const distanceX = km / (111.320 * Math.cos(coords.latitude * Math.PI / 180));
    const distanceY = km / 110.574;

    let theta, x, y;
    for(let i=0; i<points; i++) {
        theta = (i / points) * (2 * Math.PI);
        x = distanceX * Math.cos(theta);
        y = distanceY * Math.sin(theta);
        ret.push([coords.longitude + x, coords.latitude + y]);
    }
    ret.push(ret[0]);
    return ret;
}

function GeofenceLayer({ center, radius }: { center: { lat: number, lng: number }, radius: number }) {
    const { map, isLoaded } = useMap();
    const id = useId();
    const sourceId = `geofence-source-${id}`;
    const layerId = `geofence-layer-${id}`;

    useEffect(() => {
        if (!isLoaded || !map) return;

        const polygonCoords = createGeoJSONCircle(center, radius);

        map.addSource(sourceId, {
            type: 'geojson',
            data: {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'Polygon',
                    coordinates: [polygonCoords]
                }
            }
        });

        map.addLayer({
            id: layerId,
            type: 'fill',
            source: sourceId,
            paint: {
                'fill-color': '#EF4444', // Red-500
                'fill-opacity': 0.15
            }
        });
        
        // Add a line outline
        map.addLayer({
            id: `${layerId}-line`,
            type: 'line',
            source: sourceId,
            paint: {
                'line-color': '#EF4444',
                'line-width': 2,
                'line-opacity': 0.5,
                'line-dasharray': [2, 2]
            }
        });

        return () => {
            if (map.getLayer(`${layerId}-line`)) map.removeLayer(`${layerId}-line`);
            if (map.getLayer(layerId)) map.removeLayer(layerId);
            if (map.getSource(sourceId)) map.removeSource(sourceId);
        };
    }, [isLoaded, map, center.lat, center.lng, radius, sourceId, layerId]);

    return null;
}

function FitBoundsEffect({ stopLocation, userLocation }: { stopLocation: {lat:number, lng:number}, userLocation: {lat:number, lng:number} | null }) {
    const { map, isLoaded } = useMap();
    
    useEffect(() => {
        if (!isLoaded || !map || !userLocation) return;
        
        // Simple bounds calculation
        const minLng = Math.min(stopLocation.lng, userLocation.lng);
        const maxLng = Math.max(stopLocation.lng, userLocation.lng);
        const minLat = Math.min(stopLocation.lat, userLocation.lat);
        const maxLat = Math.max(stopLocation.lat, userLocation.lat);
        
        // Check if user is very far (e.g. > 100km), might not want to zoom out to world view
        // But for field ops, generally useful to see context
        
        map.fitBounds(
            [[minLng, minLat], [maxLng, maxLat]],
            { padding: 100, maxZoom: 16, duration: 2000 }
        );
    }, [isLoaded, map, stopLocation, userLocation]);

    return null;
}

export default function MapVisualizer({ stopLocation, userLocation, geofenceRadius = 200 }: MapProps) {
    // Default center is stop location
    const initialCenter: [number, number] = [stopLocation.lng, stopLocation.lat];

    return (
        <Map 
            center={initialCenter} 
            zoom={15}
            // Theme aware is automatic in Map component
        >
            <MapControls position="bottom-right" />
            <FitBoundsEffect stopLocation={stopLocation} userLocation={userLocation} />

            {/* Stop Marker */}
            <MapMarker longitude={stopLocation.lng} latitude={stopLocation.lat}>
                <MarkerContent>
                    <div className="relative">
                         <div className="absolute -inset-2 bg-red-500/20 animate-ping rounded-full" />
                         <div className="relative bg-red-600 text-white p-2 rounded-full shadow-lg border-2 border-white">
                             <MapPin className="h-5 w-5" />
                         </div>
                    </div>
                </MarkerContent>
                <MarkerPopup>
                    <div className="text-sm font-medium">{stopLocation.title}</div>
                    <div className="text-xs text-gray-500">Destination</div>
                </MarkerPopup>
            </MapMarker>

            {/* Geofence */}
            <GeofenceLayer center={stopLocation} radius={geofenceRadius} />

            {/* User Marker */}
            {userLocation && (
                <MapMarker longitude={userLocation.lng} latitude={userLocation.lat}>
                    <MarkerContent>
                         <div className="relative group">
                             <div className="w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg z-10 relative" />
                             <div className="absolute -inset-4 bg-blue-500/20 rounded-full animate-pulse z-0" />
                             {/* Bearing cone concept (optional) */}
                        </div>
                    </MarkerContent>
                    <MarkerPopup>
                        <div className="text-sm">You are here</div>
                    </MarkerPopup>
                </MapMarker>
            )}
        </Map>
    );
}
