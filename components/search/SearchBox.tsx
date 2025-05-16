'use client';

import React, { useState } from 'react';
import { Search, X, Sliders, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { FeatureFilter } from './FeatureFilter';
import { PriceRangeSlider } from './PriceRangeSlider';
import { useSearchSuggestions } from '@/hooks/useSearch';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import DistrictFilter from './DistrictFilter';
import PlaceTypeSelector from './PlaceTypeSelector';

// Types
type PlaceType = 'restaurant' | 'cafe' | 'bar' | 'hotel' | 'attraction' | 'shopping';

type District = 
  | 'Zhongzheng' | 'Datong' | 'Zhongshan' | 'Songshan' 
  | 'Daan' | 'Wanhua' | 'Xinyi' | 'Shilin' 
  | 'Beitou' | 'Neihu' | 'Nangang' | 'Wenshan';

interface SearchFilters {
  districts: District[];
  placeTypes: PlaceType[];
  priceRange: [number, number]; // min, max
  features: string[];
  nearMe: boolean;
}

interface SearchBoxProps {
  onFiltersChange: (filters: SearchFilters, query: string) => void;
  initialQuery?: string;
  initialFilters?: Partial<SearchFilters>;
  onClear?: () => void;
  className?: string;
}

// Default values
const defaultFilters: SearchFilters = {
  districts: [],
  placeTypes: [],
  priceRange: [0, 4], // Assuming 0-4 price range ($ to $$$$)
  features: [],
  nearMe: false,
};

// District options
const districts: District[] = [
  'Zhongzheng', 'Datong', 'Zhongshan', 'Songshan',
  'Daan', 'Wanhua', 'Xinyi', 'Shilin',
  'Beitou', 'Neihu', 'Nangang', 'Wenshan'
];

// Place type options
const placeTypes: PlaceType[] = [
  'restaurant', 'cafe', 'bar', 'hotel', 'attraction', 'shopping'
];

// Place type display names
const placeTypeNames: Record<PlaceType, string> = {
  restaurant: 'Restaurant',
  cafe: 'Café',
  bar: 'Bar',
  hotel: 'Hotel',
  attraction: 'Attraction',
  shopping: 'Shopping',
};

// Feature name lookup (reuse from FeatureFilter)
const featureList = [
  { id: 'wifi', name: 'Free WiFi' },
  { id: 'parking', name: 'Parking' },
  { id: 'air-conditioning', name: 'Air Conditioning' },
  { id: 'outdoor-seating', name: 'Outdoor Seating' },
  { id: 'wheelchair', name: 'Wheelchair Accessible' },
  { id: 'elevator', name: 'Elevator' },
  { id: 'accessible-bathroom', name: 'Accessible Bathroom' },
  { id: 'quiet', name: 'Quiet' },
  { id: 'romantic', name: 'Romantic' },
  { id: 'lively', name: 'Lively' },
  { id: 'family-friendly', name: 'Family Friendly' },
  { id: 'reservations', name: 'Reservations' },
  { id: 'delivery', name: 'Delivery' },
  { id: 'takeout', name: 'Takeout' },
  { id: 'table-service', name: 'Table Service' },
  { id: 'private-room', name: 'Private Room' },
  { id: 'smoking-area', name: 'Smoking Area' },
  { id: 'rooftop', name: 'Rooftop' },
  { id: 'pet-friendly', name: 'Pet Friendly' },
];
const getFeatureName = (id: string) => featureList.find(f => f.id === id)?.name || id;

// Price label helper
const getPriceLabel = (value: number): string => {
  if (value === 0) return 'Free';
  return '$'.repeat(value);
};

export function SearchBox({
  onFiltersChange,
  initialQuery = '',
  initialFilters,
  onClear,
  className,
}: SearchBoxProps) {
  // State
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>({
    ...defaultFilters,
    ...initialFilters,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  // Hook for suggestions
  const { data: suggestionsData, isLoading: suggestionsLoading } = useSearchSuggestions({
    query: query,
    enabled: query.length > 2 && isSuggestionsOpen, 
  });

  // Active filter count (excluding near me which is handled separately)
  const activeFilterCount = 
    filters.districts.length + 
    filters.placeTypes.length + 
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 4 ? 1 : 0) +
    filters.features.length;

  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuggestionsOpen(false); // Close suggestions on submit
    onFiltersChange(filters, query);
  };

  // Handle input change for suggestions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (e.target.value.length > 2) {
      setIsSuggestionsOpen(true);
    }
    else {
      setIsSuggestionsOpen(false);
    }
  }

  const handleSuggestionSelect = (suggestionQuery: string) => {
    setQuery(suggestionQuery);
    setIsSuggestionsOpen(false);
    // Optionally, trigger search immediately or wait for user to press enter/submit
    onFiltersChange(filters, suggestionQuery); 
  }

  // Handle district selection
  const toggleDistrict = (district: District) => {
    setFilters(prev => ({
      ...prev,
      districts: prev.districts.includes(district)
        ? prev.districts.filter(d => d !== district)
        : [...prev.districts, district],
    }));
  };

  // Handle place type selection
  const togglePlaceType = (placeType: PlaceType) => {
    setFilters(prev => ({
      ...prev,
      placeTypes: prev.placeTypes.includes(placeType)
        ? prev.placeTypes.filter(t => t !== placeType)
        : [...prev.placeTypes, placeType],
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters(defaultFilters);
    if (onClear) onClear();
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    if (onClear) onClear();
  };

  // Toggle near me
  const toggleNearMe = () => {
    setFilters(prev => ({
      ...prev,
      nearMe: !prev.nearMe,
    }));
  };

  return (
    <div className={cn("w-full", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Command className="w-full">
            <CommandInput
              placeholder="Search for places in Taipei..."
              value={query}
              onValueChange={setQuery}
              onFocus={() => query.length > 2 && setIsSuggestionsOpen(true)}
              className="pl-9 pr-14 h-12 text-base w-full"
            />
            {isSuggestionsOpen && suggestionsData && suggestionsData.length > 0 && (
              <CommandList className="absolute top-full mt-1 w-full bg-background border rounded-md shadow-lg z-50">
                <CommandEmpty>{suggestionsLoading ? "Loading..." : "No results found."}</CommandEmpty>
                <CommandGroup heading="Suggestions">
                  {suggestionsData.map((suggestion, index) => (
                    <CommandItem 
                      key={index} 
                      onSelect={() => handleSuggestionSelect(suggestion)}
                      className="cursor-pointer"
                    >
                      {suggestion}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            )}
          </Command>
          <div className="absolute right-2 flex space-x-1">
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
            <DropdownMenu
              open={isDropdownOpen}
              onOpenChange={setIsDropdownOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8",
                    activeFilterCount > 0 && "text-primary"
                  )}
                >
                  <Sliders className="h-4 w-4" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                  <span className="sr-only">Filters</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-[280px] p-4"
              >
                <div className="flex items-center justify-between">
                  <DropdownMenuLabel className="text-base">Filters</DropdownMenuLabel>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto px-2 text-xs"
                      onClick={clearFilters}
                    >
                      Clear all
                    </Button>
                  )}
                </div>
                <DropdownMenuSeparator />
                
                {/* New: District and Place Type filters as segmented controls */}
                <DistrictFilter
                  value={filters.districts[0]}
                  onChange={d => setFilters(prev => ({ ...prev, districts: d ? [d] : [] }))}
                  label="District"
                />
                <div className="h-2" />
                <PlaceTypeSelector
                  value={filters.placeTypes[0]}
                  onChange={t => setFilters(prev => ({ ...prev, placeTypes: t ? [t] : [] }))}
                  label="Place Type"
                />
                <DropdownMenuSeparator />
                
                {/* Feature filter */}
                <FeatureFilter
                  selectedFeatures={filters.features}
                  onChange={(features) => setFilters((prev) => ({ ...prev, features }))}
                  className="mb-2"
                />
                <DropdownMenuSeparator />
                {/* Price range slider */}
                <PriceRangeSlider
                  value={filters.priceRange}
                  onChange={(priceRange) => setFilters((prev) => ({ ...prev, priceRange }))}
                  min={0}
                  max={4}
                  step={1}
                  className="mb-2"
                />
                <DropdownMenuSeparator />
                
                {/* Near me button */}
                <div className="py-2">
                  <Button
                    type="button"
                    variant={filters.nearMe ? "default" : "outline"}
                    size="sm"
                    className="w-full"
                    onClick={toggleNearMe}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Near Me
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Active filters display */}
        {(filters.districts.length > 0 || filters.placeTypes.length > 0 || filters.features.length > 0 || (filters.priceRange[0] > 0 || filters.priceRange[1] < 4) || filters.nearMe) && (
          <div className="flex flex-wrap gap-1 mt-2">
            {filters.districts.map((district) => (
              <Badge
                key={district}
                variant="secondary"
                className="capitalize"
              >
                {district}
                <button
                  type="button"
                  className="ml-1 rounded-full"
                  onClick={() => toggleDistrict(district)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {district} filter</span>
                </button>
              </Badge>
            ))}
            {filters.placeTypes.map((type) => (
              <Badge
                key={type}
                variant="secondary"
                className="capitalize"
              >
                {placeTypeNames[type]}
                <button
                  type="button"
                  className="ml-1 rounded-full"
                  onClick={() => togglePlaceType(type)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {type} filter</span>
                </button>
              </Badge>
            ))}
            {filters.features.map((featureId) => (
              <Badge
                key={featureId}
                variant="secondary"
                className="capitalize"
              >
                {getFeatureName(featureId)}
                <button
                  type="button"
                  className="ml-1 rounded-full"
                  onClick={() => setFilters((prev) => ({ ...prev, features: prev.features.filter(f => f !== featureId) }))}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {getFeatureName(featureId)} filter</span>
                </button>
              </Badge>
            ))}
            {(filters.priceRange[0] > 0 || filters.priceRange[1] < 4) && (
              <Badge variant="secondary">
                Price: {getPriceLabel(filters.priceRange[0])} - {getPriceLabel(filters.priceRange[1])}
                <button
                  type="button"
                  className="ml-1 rounded-full"
                  onClick={() => setFilters((prev) => ({ ...prev, priceRange: [0, 4] }))}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove price range filter</span>
                </button>
              </Badge>
            )}
            {filters.nearMe && (
              <Badge
                variant="secondary"
                className="capitalize"
              >
                Near Me
                <button
                  type="button"
                  className="ml-1 rounded-full"
                  onClick={toggleNearMe}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove near me filter</span>
                </button>
              </Badge>
            )}
          </div>
        )}
      </form>

      {/* Search suggestions */}
      {suggestions.length > 0 && (
        <div className="mt-2 border rounded-md shadow-sm bg-background">
          <ul className="py-1">
            {suggestions.map((result) => (
              <li key={result.placeId} className="px-3 py-2 hover:bg-accent cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{result.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {result.district} · {placeTypeNames[result.placeType]}
                    </p>
                  </div>
                </div>
                {result.highlights.length > 0 && (
                  <p className="text-sm mt-1 text-muted-foreground">
                    {result.highlights[0].text}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 