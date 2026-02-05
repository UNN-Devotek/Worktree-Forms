
import { useState, useEffect } from 'react';

interface GeolocationState {
  loaded: boolean;
  coordinates: { lat: number; lng: number } | null;
  error?: { code: number; message: string };
}

export function useGeolocation() {
  const [location, setLocation] = useState<GeolocationState>({
    loaded: false,
    coordinates: null,
  });

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocation({
        loaded: true,
        coordinates: null,
        error: { code: 0, message: "Geolocation not supported" },
      });
      return;
    }

    const onSuccess = (location: GeolocationPosition) => {
      setLocation({
        loaded: true,
        coordinates: {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        },
      });
    };

    const onError = (error: GeolocationPositionError) => {
      setLocation({
        loaded: true,
        coordinates: null,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    };

    const watcher = navigator.geolocation.watchPosition(onSuccess, onError, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    });

    return () => navigator.geolocation.clearWatch(watcher);
  }, []);

  return location;
}

// Simple Haversine distance in meters
export function getDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
) {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
