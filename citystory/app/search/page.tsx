'use client'; // Required for useState, useEffect, and event handlers

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SearchBox } from '@/components/search/SearchBox'; // Assuming this is the correct path
import { SearchResults } from '@/components/search/SearchResults'; // Assuming this is the correct path
import { useSearch } from '@/hooks/useSearch';
import { SearchFilters as CommonSearchFilters } from '@/types'; // Renamed to avoid conflict
// Remove unused imports like Card, CardContent, Button, Input, Select from '@/components/ui' if no longer directly used
// Remove FeaturedPlaceCard if SearchResults handles all display

// Create a single instance of QueryClient
const queryClient = new QueryClient();

export default function SearchPage() {
  // State to hold the current search filters and query term from SearchBox
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilters, setActiveFilters] = useState<CommonSearchFilters>({});

  // Use the useSearch hook
  const { data: results, isLoading, error, refetch } = useSearch({
    filters: { ...activeFilters, query: searchQuery },
    enabled: false, // Initially disabled, will be enabled by effect or manual refetch
  });

  // Handler for when filters or query change in SearchBox
  const handleSearchChange = (newFilters: CommonSearchFilters, newQuery: string) => {
    setActiveFilters(newFilters);
    setSearchQuery(newQuery);
  };

  // Effect to trigger search when filters or query change
  useEffect(() => {
    // Only search if there's a query or at least one filter active (excluding defaults)
    const hasActiveFilter = 
      activeFilters.placeType || 
      activeFilters.district || 
      (activeFilters.features && activeFilters.features.length > 0) ||
      (activeFilters.priceRange && (activeFilters.priceRange[0] !== 0 || activeFilters.priceRange[1] !== 4)) ||
      activeFilters.coordinates;

    if (searchQuery.trim() !== '' || hasActiveFilter) {
      refetch(); // Manually trigger the search query
    }
  }, [searchQuery, activeFilters, refetch]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="container mx-auto py-8 px-4">
        <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-8 text-center">Find Places in Taipei</h1>

        <div className="max-w-4xl mx-auto mb-10">
          <SearchBox 
            initialQuery={searchQuery}
            initialFilters={activeFilters}
            onFiltersChange={handleSearchChange} 
          />
        </div>

        {/* Display search results, loading state, or errors */}
        <SearchResults 
          data={results}
          isLoading={isLoading}
          error={error}
        />

        {/* Remove static FeaturedPlaceCard sections if search results replace them */}
        {/* ... existing Popular in Taipei and Hidden Gems sections removed ... */}
      </div>
    </QueryClientProvider>
  );
}
