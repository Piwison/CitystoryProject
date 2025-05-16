import { useEffect, useState } from 'react';
import { Place, PlaceFilters, PaginatedResponse } from '@/types/place';
import { placeService } from '@/lib/services/placeService';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PlaceListProps {
  onPlaceClick?: (place: Place) => void;
}

// Extend PlaceFilters with UI-specific filter fields
interface ExtendedPlaceFilters extends PlaceFilters {
  place_type?: string;
  price_range?: number;
}

export function PlaceList({ onPlaceClick }: PlaceListProps) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ExtendedPlaceFilters>({
    page: 1,
    limit: 10,
    search: '',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  const fetchPlaces = async () => {
    const abortController = new AbortController();

    try {
      setIsLoading(true);
      setError(null);
      
      // Convert ExtendedPlaceFilters to PlaceFilters
      const apiFilters: PlaceFilters = {
        search: filters.search,
        category: filters.place_type, // Map place_type to category
        page: filters.page,
        limit: filters.limit,
      };
      
      const response = await placeService.getPlaces(apiFilters);
      
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from server');
      }

      setPlaces(response.items);
      setPagination({
        currentPage: response.page,
        totalPages: response.totalPages,
        totalItems: response.total,
      });
    } catch (err) {
      // Don't set error if request was cancelled
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to fetch places. Please try again.';
        
      setError(errorMessage);
      console.error('Error fetching places:', err);
    } finally {
      setIsLoading(false);
    }

    // Cleanup function
    return () => {
      abortController.abort();
    };
  };

  useEffect(() => {
    let isSubscribed = true;
    
    const doFetch = async () => {
      const cleanup = await fetchPlaces();
      if (!isSubscribed && cleanup) {
        cleanup();
      }
    };

    doFetch();

    return () => {
      isSubscribed = false;
    };
  }, [filters]);

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleFilterChange = (key: keyof ExtendedPlaceFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined, page: 1 }));
  };

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        {error}
        <Button 
          onClick={fetchPlaces} 
          variant="outline" 
          className="ml-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="Search places..."
          value={filters.search || ''}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="w-full"
        />
        <Select
          value={filters.place_type || ''}
          onValueChange={(value) => handleFilterChange('place_type', value)}
        >
          <option value="">All Types</option>
          <option value="restaurant">Restaurant</option>
          <option value="cafe">Cafe</option>
          <option value="bar">Bar</option>
          <option value="attraction">Attraction</option>
        </Select>
        <Select
          value={filters.price_range?.toString() || ''}
          onValueChange={(value) => handleFilterChange('price_range', value)}
        >
          <option value="">All Prices</option>
          {[1, 2, 3, 4, 5].map((price) => (
            <option key={price} value={price.toString()}>
              {'$'.repeat(price)}
            </option>
          ))}
        </Select>
      </div>

      {/* Places Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-48 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : places.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No places found. Try adjusting your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {places.map((place) => (
            <Card
              key={place.id}
              className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onPlaceClick?.(place)}
            >
              {place.photos && place.photos[0] && (
                <div className="h-32 w-full mb-2 overflow-hidden rounded-md">
                  <img
                    src={place.photos[0].url}
                    alt={place.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <h3 className="font-semibold text-lg">{place.name}</h3>
              <p className="text-sm text-gray-600">{place.address}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500 capitalize">{place.place_type}</span>
                <span className="text-sm text-gray-500">
                  {'$'.repeat(place.price_range || 0)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && places.length > 0 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              />
            </PaginationItem>
            {[...Array(pagination.totalPages)].map((_, i) => (
              <PaginationItem key={i + 1}>
                <PaginationLink
                  onClick={() => handlePageChange(i + 1)}
                  isActive={pagination.currentPage === i + 1}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
} 
} 