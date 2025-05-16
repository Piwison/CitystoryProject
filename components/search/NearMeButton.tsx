'use client';

import React, { useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface NearMeButtonProps {
  onLocationChange: (coords: Coordinates | null) => void;
  active?: boolean;
  maxDistanceKm?: number;
  className?: string;
}

export function NearMeButton({
  onLocationChange,
  active = false,
  maxDistanceKm = 5,
  className,
}: NearMeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Get current location and trigger callback
  const handleClick = async () => {
    // If already active, clear the filter
    if (active) {
      onLocationChange(null);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Check if geolocation is available
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by your browser");
      }
      
      // Get current position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        });
      });
      
      // Pass coordinates to parent component
      onLocationChange({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      
      // Show success toast
      toast({
        title: "Location detected",
        description: `Showing places within ${maxDistanceKm}km of your location`,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error getting location:", error);
      
      // Show error toast with appropriate message
      let errorMessage = "Could not determine your location";
      if (error instanceof Error) {
        if (error.message.includes("permission denied")) {
          errorMessage = "Location access denied. Please enable location services in your browser settings.";
        } else if (error.message.includes("timeout")) {
          errorMessage = "Location request timed out. Please try again.";
        }
      }
      
      toast({
        title: "Location error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
      
      // Clear the filter on error
      onLocationChange(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      className={className}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <MapPin className="mr-2 h-4 w-4" />
      )}
      Near Me
    </Button>
  );
} 