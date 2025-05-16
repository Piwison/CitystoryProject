import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { searchPlaces, getSearchSuggestions } from '@/lib/api/services/searchService';
import { PlaceSearchResult, SearchFilters, ApiError } from '@/types';

interface UseSearchOptions {
  filters: SearchFilters;
  enabled?: boolean; // To control when the query is executed
}

export const useSearch = ({ filters, enabled = true }: UseSearchOptions): UseQueryResult<PlaceSearchResult[], ApiError> => {
  return useQuery<PlaceSearchResult[], ApiError, PlaceSearchResult[], [string, SearchFilters]>(
    ['searchPlaces', filters], // Query key: includes filters to auto-refetch on change
    () => searchPlaces(filters),
    {
      enabled: enabled && (!!filters.query || !!filters.placeType || !!filters.district || (!!filters.coordinates && !!filters.radius)), // Only run query if enabled and some filters are present
      keepPreviousData: true, // Useful for pagination or smoothly updating results
      // Add other react-query options as needed, e.g., staleTime, cacheTime
      // onError: (error) => { console.error("Error fetching search results:", error.message); },
    }
  );
};

interface UseSearchSuggestionsOptions {
  query: string;
  enabled?: boolean;
}

export const useSearchSuggestions = (
  { query, enabled = true }: UseSearchSuggestionsOptions
): UseQueryResult<string[], ApiError> => {
  return useQuery<string[], ApiError, string[], [string, string]>(
    ['searchSuggestions', query], // Query key
    () => getSearchSuggestions(query),
    {
      enabled: enabled && !!query && query.length > 2, // Only fetch if query is non-empty and has some length
      // staleTime: 1000 * 60 * 5, // Cache suggestions for 5 minutes, for example
    }
  );
}; 