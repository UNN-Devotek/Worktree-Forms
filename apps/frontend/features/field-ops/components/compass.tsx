'use client';

import React, { useState, useEffect } from 'react';
import { Navigation, ArrowUp } from 'lucide-react';

interface CompassProps {
    heading?: number; // Manual override (testing) or current heading 0-360
    targetBearing?: number; // The specific angle we want to point to
    className?: string;
}

export function Compass({ heading: propHeading, targetBearing, className }: CompassProps) {
    const [heading, setHeading] = useState(propHeading || 0);

    useEffect(() => {
        if (typeof propHeading === 'number') {
            setHeading(propHeading);
            return;
        }

        const handleOrientation = (event: DeviceOrientationEvent) => {
            // alpha: 0 is North, usually. 
            // iOS might need webkitCompassHeading
            let compass = event.alpha;
            
            // @ts-ignore - iOS specific property
            if (event.webkitCompassHeading) {
                // @ts-ignore
                compass = event.webkitCompassHeading;
            }

            if (compass !== null) {
                setHeading(compass);
            }
        };

        if (window.DeviceOrientationEvent) {
             window.addEventListener('deviceorientation', handleOrientation, true);
        }

        return () => {
             window.removeEventListener('deviceorientation', handleOrientation, true);
        };
    }, [propHeading]);

    // Calculate the needle rotation
    // If phone is pointing North (0), needle points North (0 difference).
    // If phone is pointing East (90), needle (North) should rotate -90 to keep pointing true north on screen if we rotate the card, 
    // BUT typically we rotate the *compass card* or *needle*.
    // Common UI: Needle stays fixed up, Card rotates? OR Card fixed, Needle rotates.
    // Story says "Needle rotates to point North".
    
    // Rotation Logic: 
    // To point North: transform: rotate(-heading deg)
    
    // To point to Target:
    // If target is East (90), and we face North (0), arrow should point Right (90).
    // If we face East (90), arrow should point Up (0 relative to device).
    // Difference = Target - Heading.
    
    const targetRotation = targetBearing !== undefined ? (targetBearing - heading) : null;

    return (
        <div className={`relative w-32 h-32 flex items-center justify-center rounded-full border-4 border-muted bg-background shadow-inner ${className}`}>
             {/* North Indicator (Always points North relative to device heading) */}
             <div 
                className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out"
                style={{ transform: `rotate(${-heading}deg)` }}
             >
                 <div className="flex flex-col items-center justify-between h-full py-2">
                     <span className="text-xs font-bold text-red-500">N</span>
                     <span className="text-xs font-bold text-muted-foreground">S</span>
                 </div>
                 <div className="absolute inset-0 flex items-center justify-between w-full px-2 rotate-90">
                     <span className="text-xs font-bold text-muted-foreground">E</span>
                     <span className="text-xs font-bold text-muted-foreground">W</span>
                 </div>
             
             </div>

             {/* Center Readout */}
             <div className="absolute z-10 bg-background/80 backdrop-blur-sm rounded px-1 text-xs font-mono">
                 {Math.round(heading)}°
             </div>

             {/* Target Arrow (If set) */}
             {targetRotation !== null && (
                 <div 
                    className="absolute inset-0 flex items-start justify-center pt-1 transition-transform duration-300 ease-out z-20"
                    style={{ transform: `rotate(${targetRotation}deg)` }}
                 >
                     <ArrowUp className="w-8 h-8 text-blue-600 fill-blue-600 drop-shadow-md" />
                 </div>
             )}
        </div>
    );
}

// Utility to calculate bearing
export function calculateBearing(startLat: number, startLng: number, destLat: number, destLng: number) {
  const startLatRad = toRadians(startLat);
  const startLngRad = toRadians(startLng);
  const destLatRad = toRadians(destLat);
  const destLngRad = toRadians(destLng);

  const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
  const x = Math.cos(startLatRad) * Math.sin(destLatRad) -
            Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);
  
  let brng = Math.atan2(y, x);
  brng = toDegrees(brng);
  return (brng + 360) % 360;
}

function toRadians(degrees: number) {
  return degrees * Math.PI / 180;
}

function toDegrees(radians: number) {
  return radians * 180 / Math.PI;
}
