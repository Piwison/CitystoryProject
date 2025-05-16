'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';

interface Coordinates {
  lat: number;
  lng: number;
}

interface NearbyPlace {
  id: string;
  name: string;
  slug: string;
  coordinates: Coordinates;
  distance: number; // in meters
  type: string;
}

interface LocationDisplayProps {
  address: string;
  district?: string;
  coordinates?: Coordinates;
  nearbyPlaces?: NearbyPlace[];
  showNearby?: boolean;
  className?: string;
}

export default function LocationDisplay({
  address,
  district,
  coordinates,
  nearbyPlaces = [],
  showNearby = false,
  className = '',
}: LocationDisplayProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  
  // In a real implementation, we would load the Google Maps or Mapbox library here
  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleGetDirections = () => {
    // Open Google Maps directions in a new tab
    if (coordinates) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`,
        '_blank'
      );
    } else {
      // If no coordinates, use the address
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`,
        '_blank'
      );
    }
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${meters.toFixed(0)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Map Component */}
      <div
        className="relative h-64 w-full rounded-lg overflow-hidden border border-gray-200"
        onMouseEnter={() => setIsInteracting(true)}
        onMouseLeave={() => setIsInteracting(false)}
      >
        {/* Map Placeholder (Replace with actual map implementation) */}
        <div
          className="h-full w-full bg-gray-100"
          style={{
            backgroundImage: "url('/taipei-cute-map.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>

        {/* Overlay with Address Info */}
        <div
          className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
            isInteracting ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <Card className="w-4/5 max-w-sm shadow-lg">
              <CardContent className="p-4 text-center">
                <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-medium mb-1">{district || 'Location'}</h3>
                <p className="text-sm text-gray-600 mb-4">{address}</p>
                <div className="flex justify-center gap-2">
                  <Button size="sm" onClick={handleGetDirections}>
                    <Navigation className="h-4 w-4 mr-2" />
                    Get Directions
                  </Button>
                  <Button size="sm" variant="outline">
                    <MapIcon className="h-4 w-4 mr-2" />
                    View Larger Map
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Floating Button when interacting */}
        <div
          className={`absolute bottom-4 right-4 transition-opacity duration-300 ${
            isInteracting ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Button size="sm" onClick={handleGetDirections}>
            <Navigation className="h-4 w-4 mr-2" />
            Get Directions
          </Button>
        </div>
      </div>

      {/* Nearby Places */}
      {showNearby && nearbyPlaces.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Nearby Places</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nearbyPlaces.map((place) => (
              <Card key={place.id} className="overflow-hidden">
                <a href={`/places/${place.slug}`} className="block hover:bg-gray-50">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="bg-gray-100 h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{place.name}</h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="capitalize">{place.type}</span>
                        <span className="mx-1">•</span>
                        <span>{formatDistance(place.distance)}</span>
                      </p>
                    </div>
                  </CardContent>
                </a>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 