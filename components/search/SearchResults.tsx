'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Grid3X3, Map, Loader2, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { StarRating } from '@/components/ui/star-rating';
import { PlaceSearchResult, ApiError } from '@/types';
import { SavePlaceButton } from '@/components/ui/SavePlaceButton';

// Types
type PlaceType = 'restaurant' | 'cafe' | 'bar' | 'hotel' | 'attraction' | 'shopping';
type District = 'Zhongzheng' | 'Datong' | 'Zhongshan' | 'Songshan' 
  | 'Daan' | 'Wanhua' | 'Xinyi' | 'Shilin' 
  | 'Beitou' | 'Neihu' | 'Nangang' | 'Wenshan';

interface Coordinates {
  latitude: number;
  longitude: number;
}

// Place result interface
interface PlaceResult {
  id: string;
  slug: string;
  title: string;
  description: string;
  placeType: PlaceType;
  district: District;
  address: string;
  coordinates: Coordinates;
  rating: number;
  reviewCount: number;
  priceLevel: number; // 0-4, where 0 is free and 4 is most expensive
  imageUrl?: string;
  features: string[];
  distance?: number; // In kilometers, only present when near search is active
  highlights?: { field: string; text: string }[];
}

interface SearchResultsProps {
  data?: PlaceSearchResult[];
  isLoading: boolean;
  error?: ApiError | null;
  nearMeActive?: boolean;
}

// Helper function to format price level
const formatPriceLevel = (level: number): string => {
  if (level === 0) return 'Free';
  return '$'.repeat(level);
};

// Place type display names
const placeTypeNames: Record<PlaceType, string> = {
  restaurant: 'Restaurant',
  cafe: 'Café',
  bar: 'Bar',
  hotel: 'Hotel',
  attraction: 'Attraction',
  shopping: 'Shopping',
};

// Helper to render highlighted text
function renderHighlight(field: string, value: string, highlights?: { field: string; text: string }[]) {
  if (!highlights) return value;
  const match = highlights.find(h => h.field.toLowerCase() === field.toLowerCase());
  if (!match || !match.text) return value;
  return <span dangerouslySetInnerHTML={{ __html: match.text }} />;
}

export function SearchResults({
  data: results,
  isLoading,
  error,
  nearMeActive = false,
}: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p className="text-muted-foreground">Searching...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-destructive/10 p-3 mb-4">
          <MapPin className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="text-lg font-medium mb-2 text-destructive">Oops! Something went wrong.</h3>
        <p className="text-muted-foreground max-w-sm">
          {error.message || "We couldn't load search results. Please try again later."}
        </p>
      </div>
    );
  }
  
  // Handle empty state (no results and not loading)
  if (!results || results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-3 mb-4">
          <Map className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-medium mb-2">No results found</h3>
        <p className="text-muted-foreground max-w-sm">
          Try adjusting your search or filters to find what you're looking for.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {results.length} {results.length === 1 ? 'result' : 'results'} found
        </h2>
        <Tabs defaultValue="list" className="w-auto" onValueChange={(value) => setViewMode(value as 'list' | 'map')}>
          <TabsList className="grid w-[160px] grid-cols-2">
            <TabsTrigger value="list">
              <Grid3X3 className="h-4 w-4 mr-2" />
              List
            </TabsTrigger>
            <TabsTrigger value="map">
              <Map className="h-4 w-4 mr-2" />
              Map
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* List view */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((place, index) => {
            // Check if this is the last element
            const isLastElement = index === results.length - 1;
            
            return (
              <motion.div
                key={place.id}
                ref={isLastElement ? lastElementRef : undefined}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="h-full overflow-hidden flex flex-col">
                  {/* Card image */}
                  <div className="relative h-48 overflow-hidden">
                    {place.imageUrl ? (
                      <img
                        src={place.imageUrl}
                        alt={place.title}
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground">No image</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-1">
                      <Badge className="bg-background/80 text-foreground backdrop-blur-sm">
                        {placeTypeNames[place.placeType]}
                      </Badge>
                      {place.distance !== undefined && (
                        <Badge className="bg-primary/90 backdrop-blur-sm">
                          {place.distance.toFixed(1)} km
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {renderHighlight('title', place.title, place.highlights)}
                        </CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                          {renderHighlight('description', place.description, place.highlights)}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">
                         {formatPriceLevel(place.priceLevel)}
                        </div>
                        <SavePlaceButton placeId={place.id} placeTitle={place.title} />
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pb-2 flex-grow">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {renderHighlight('description', place.description, place.highlights)}
                    </p>
                    
                    {place.features.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {place.features.slice(0, 3).map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {place.features.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{place.features.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="pt-0">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <StarRating value={place.rating} readOnly size="sm" />
                        <span className="text-sm text-muted-foreground ml-2">
                          ({place.reviewCount})
                        </span>
                      </div>
                      <Button size="sm" variant="outline">
                        Details
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
      
      {/* Map view */}
      {viewMode === 'map' && (
        <div className="bg-muted rounded-md h-[600px] flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium">Map View Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto mt-2">
              We're working on integrating an interactive map to show search results geographically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 