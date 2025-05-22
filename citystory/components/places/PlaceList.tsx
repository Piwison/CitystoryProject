import { useEffect, useState } from 'react';
import { Place, PlaceFilters, PaginatedResponse } from '@/types/place';
import { getManagedPlaces } from '@/lib/api/services/placeManagementService';
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
import { useSession } from 'next-auth/react';
import { ManagedPlace } from '@/types';

interface PlaceListProps {
  onPlaceClick?: (place: Place) => void;
  userId?: string; // Allow userId to be passed as prop
}

// Extend PlaceFilters with UI-specific filter fields
interface ExtendedPlaceFilters extends PlaceFilters {
  placeType?: string;
  priceLevel?: string;
}

export function PlaceList({ onPlaceClick, userId: propUserId }: PlaceListProps) {
  const { data: session } = useSession();
  // Use userId from props or try to get from session/localStorage
  // In a real app, you might want to get this from a global auth context
  const [userId, setUserId] = useState<string | undefined>(propUserId);
  
  // Effect to initialize userId from localStorage if not provided as prop
  useEffect(() => {
    if (!userId) {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        setUserId(storedUserId);
      }
    }
  }, [userId]);
  
  const [places, setPlaces] = useState<ManagedPlace[]>([]);
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
    if (!userId) {
      setError("You must be logged in to view your places");
      return;
    }

    const abortController = new AbortController();

    try {
      setIsLoading(true);
      setError(null);
      
      // getManagedPlaces expects a userId string, not filters
      const response = await getManagedPlaces(userId);
      
      if (!response || !Array.isArray(response)) {
        throw new Error('Invalid response from server');
      }

      // Filter places based on current filters
      const filteredPlaces = filterPlaces(response);
      
      // Calculate pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const startIndex = (page - 1) * limit; // Fix: correct calculation for startIndex
      const endIndex = startIndex + limit;
      
      // Get current page of places
      const paginatedPlaces = filteredPlaces.slice(startIndex, endIndex);
      
      setPlaces(paginatedPlaces);
      setPagination({
        currentPage: page,
        totalPages: Math.max(1, Math.ceil(filteredPlaces.length / limit)),
        totalItems: filteredPlaces.length,
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

  // Filter places client-side based on current filters
  const filterPlaces = (places: ManagedPlace[]): ManagedPlace[] => {
    return places.filter(place => {
      // Filter by search term
      if (filters.search && !place.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      // Filter by place type
      if (filters.placeType && place.placeType !== filters.placeType) {
        return false;
      }
      
      // Filter by price level
      if (filters.priceLevel && place.priceLevel !== filters.priceLevel) {
        return false;
      }
      
      return true;
    });
  };

  useEffect(() => {
    let isSubscribed = true;
    
    const doFetch = async () => {
      if (userId) { // Only fetch if userId is available
        const cleanup = await fetchPlaces();
        if (!isSubscribed && cleanup) {
          cleanup();
        }
      }
    };

    doFetch();

    return () => {
      isSubscribed = false;
    };
  }, [userId, filters]);

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
          value={filters.placeType || ''}
          onValueChange={(value) => handleFilterChange('placeType', value)}
        >
          <option value="">All Types</option>
          <option value="restaurant">Restaurant</option>
          <option value="cafe">Cafe</option>
          <option value="bar">Bar</option>
          <option value="attraction">Attraction</option>
        </Select>
        <Select
          value={filters.priceLevel || ''}
          onValueChange={(value) => handleFilterChange('priceLevel', value)}
        >
          <option value="">All Prices</option>
          {['0', '200', '400', '600', '800', '1000', '1500', '2000'].map((price) => (
            <option key={price} value={price}>
              {price === '0' ? 'Free' : `NT$${price}`}
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
              onClick={() => onPlaceClick?.(place as unknown as Place)}
            >
              {place.imageUrl && (
                <div className="h-32 w-full mb-2 overflow-hidden rounded-md">
                  <img
                    src={place.imageUrl}
                    alt={place.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <h3 className="font-semibold text-lg">{place.title}</h3>
              <p className="text-sm text-gray-600">{place.address}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500 capitalize">{place.placeType}</span>
                <span className="text-sm text-gray-500">
                  {place.priceLevel === '0' ? 'Free' : `NT$${place.priceLevel || '0'}`}
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