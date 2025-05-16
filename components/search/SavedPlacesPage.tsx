'use client';

import React, { useState, useRef } from 'react';
import { Grid3X3, GridIcon, Search, SlidersHorizontal, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { StarRating } from '@/components/ui/star-rating';

// Types
type PlaceType = 'restaurant' | 'cafe' | 'bar' | 'hotel' | 'attraction' | 'shopping';
type District = 'Zhongzheng' | 'Datong' | 'Zhongshan' | 'Songshan' 
  | 'Daan' | 'Wanhua' | 'Xinyi' | 'Shilin' 
  | 'Beitou' | 'Neihu' | 'Nangang' | 'Wenshan';

// Saved place interface
interface SavedPlace {
  id: string;
  placeId: string;
  title: string;
  placeType: PlaceType;
  district: District;
  address: string;
  rating: number;
  reviewCount: number;
  priceLevel: number;
  imageUrl?: string;
  savedDate: string;
  userNote?: string;
  visitPlanned?: boolean;
  visited?: boolean;
}

interface SavedPlacesPageProps {
  savedPlaces: SavedPlace[];
  onUpdateNote: (placeId: string, note: string) => Promise<void>;
  onRemovePlace: (placeId: string) => Promise<void>;
  onToggleVisited: (placeId: string, visited: boolean) => Promise<void>;
  onTogglePlanned: (placeId: string, planned: boolean) => Promise<void>;
}

// Place type display names
const placeTypeNames: Record<PlaceType, string> = {
  restaurant: 'Restaurant',
  cafe: 'Café',
  bar: 'Bar',
  hotel: 'Hotel',
  attraction: 'Attraction',
  shopping: 'Shopping',
};

// Helper to format price level
const formatPriceLevel = (level: number): string => {
  if (level === 0) return 'Free';
  return '$'.repeat(level);
};

export function SavedPlacesPage({
  savedPlaces,
  onUpdateNote,
  onRemovePlace,
  onToggleVisited,
  onTogglePlanned,
}: SavedPlacesPageProps) {
  // State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState<{ id: string; note: string } | null>(null);
  const [filter, setFilter] = useState<{
    placeTypes: PlaceType[];
    districts: District[];
    visited: boolean | null;
    planned: boolean | null;
  }>({
    placeTypes: [],
    districts: [],
    visited: null,
    planned: null,
  });
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'rating'>('date');
  
  // Dialog ref for note editing
  const noteInputRef = useRef<HTMLTextAreaElement>(null);
  
  // Handle note update
  const handleNoteUpdate = async () => {
    if (editingNote) {
      await onUpdateNote(editingNote.id, editingNote.note);
      setEditingNote(null);
    }
  };
  
  // Handle place deletion
  const handleRemovePlace = async (placeId: string) => {
    if (confirm('Are you sure you want to remove this place from your saved places?')) {
      await onRemovePlace(placeId);
    }
  };
  
  // Toggle place type filter
  const togglePlaceTypeFilter = (type: PlaceType) => {
    setFilter(prev => ({
      ...prev,
      placeTypes: prev.placeTypes.includes(type)
        ? prev.placeTypes.filter(t => t !== type)
        : [...prev.placeTypes, type],
    }));
  };
  
  // Toggle district filter
  const toggleDistrictFilter = (district: District) => {
    setFilter(prev => ({
      ...prev,
      districts: prev.districts.includes(district)
        ? prev.districts.filter(d => d !== district)
        : [...prev.districts, district],
    }));
  };
  
  // Toggle visited filter
  const toggleVisitedFilter = (value: boolean | null) => {
    setFilter(prev => ({
      ...prev,
      visited: value,
    }));
  };
  
  // Toggle planned filter
  const togglePlannedFilter = (value: boolean | null) => {
    setFilter(prev => ({
      ...prev,
      planned: value,
    }));
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilter({
      placeTypes: [],
      districts: [],
      visited: null,
      planned: null,
    });
    setSearchQuery('');
  };
  
  // Filter and sort places
  const filteredPlaces = savedPlaces.filter(place => {
    // Search query filter
    if (searchQuery && !place.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Place type filter
    if (filter.placeTypes.length > 0 && !filter.placeTypes.includes(place.placeType)) {
      return false;
    }
    
    // District filter
    if (filter.districts.length > 0 && !filter.districts.includes(place.district)) {
      return false;
    }
    
    // Visited filter
    if (filter.visited !== null && place.visited !== filter.visited) {
      return false;
    }
    
    // Planned filter
    if (filter.planned !== null && place.visitPlanned !== filter.planned) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    // Sort by selected option
    switch (sortBy) {
      case 'date':
        return new Date(b.savedDate).getTime() - new Date(a.savedDate).getTime();
      case 'name':
        return a.title.localeCompare(b.title);
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });
  
  // Check if any filters are active
  const isFilterActive = 
    searchQuery || 
    filter.placeTypes.length > 0 || 
    filter.districts.length > 0 || 
    filter.visited !== null || 
    filter.planned !== null;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Saved Places</h1>
        <Tabs defaultValue="grid" className="w-auto" onValueChange={(value) => setViewMode(value as 'grid' | 'list')}>
          <TabsList className="grid w-[160px] grid-cols-2">
            <TabsTrigger value="grid">
              <Grid3X3 className="h-4 w-4 mr-2" />
              Grid
            </TabsTrigger>
            <TabsTrigger value="list">
              <GridIcon className="h-4 w-4 mr-2" />
              List
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your saved places..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="absolute right-3 top-3"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filter
                {isFilterActive && (
                  <Badge className="ml-1 px-1 py-0 h-5">
                    {filter.placeTypes.length + filter.districts.length + 
                      (filter.visited !== null ? 1 : 0) + 
                      (filter.planned !== null ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[220px]">
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <span className="font-medium">Place Type</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {Object.entries(placeTypeNames).map(([type, name]) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={filter.placeTypes.includes(type as PlaceType)}
                  onCheckedChange={() => togglePlaceTypeFilter(type as PlaceType)}
                >
                  {name}
                </DropdownMenuCheckboxItem>
              ))}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <span className="font-medium">Status</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={filter.visited === true}
                onCheckedChange={() => toggleVisitedFilter(filter.visited === true ? null : true)}
              >
                Visited
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filter.planned === true}
                onCheckedChange={() => togglePlannedFilter(filter.planned === true ? null : true)}
              >
                Plan to Visit
              </DropdownMenuCheckboxItem>
              
              {isFilterActive && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={clearFilters}>
                    Clear all filters
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Sort By
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setSortBy('date')} className={sortBy === 'date' ? 'font-medium' : ''}>
                Date Saved
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSortBy('name')} className={sortBy === 'name' ? 'font-medium' : ''}>
                Name
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSortBy('rating')} className={sortBy === 'rating' ? 'font-medium' : ''}>
                Rating
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Active filter badges */}
      {isFilterActive && (
        <div className="flex flex-wrap gap-1">
          {filter.placeTypes.map(type => (
            <Badge key={type} variant="secondary">
              {placeTypeNames[type]}
              <button 
                onClick={() => togglePlaceTypeFilter(type)}
                className="ml-1 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          
          {filter.districts.map(district => (
            <Badge key={district} variant="secondary">
              {district}
              <button 
                onClick={() => toggleDistrictFilter(district)}
                className="ml-1 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          
          {filter.visited !== null && (
            <Badge variant="secondary">
              {filter.visited ? 'Visited' : 'Not Visited'}
              <button 
                onClick={() => toggleVisitedFilter(null)}
                className="ml-1 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filter.planned !== null && (
            <Badge variant="secondary">
              {filter.planned ? 'Planned' : 'Not Planned'}
              <button 
                onClick={() => togglePlannedFilter(null)}
                className="ml-1 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {searchQuery && (
            <Badge variant="secondary">
              "{searchQuery}"
              <button 
                onClick={() => setSearchQuery('')}
                className="ml-1 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
      
      {/* Empty state */}
      {filteredPlaces.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/20">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-medium mb-2">No saved places found</h2>
          {isFilterActive ? (
            <>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or search terms
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear all filters
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground">
              When you save places, they will appear here
            </p>
          )}
        </div>
      )}
      
      {/* Grid view */}
      {viewMode === 'grid' && filteredPlaces.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPlaces.map((place) => (
            <Card key={place.id} className="overflow-hidden">
              {/* Place image */}
              <div className="relative h-36 w-full">
                {place.imageUrl ? (
                  <img 
                    src={place.imageUrl} 
                    alt={place.title} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground">No image</span>
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <Badge className="bg-background/80 text-foreground backdrop-blur-sm">
                    {placeTypeNames[place.placeType]}
                  </Badge>
                </div>
              </div>
              
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <CardTitle className="text-base line-clamp-1">{place.title}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <SlidersHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingNote({ id: place.id, note: place.userNote || '' })}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Note
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onToggleVisited(place.id, !place.visited)}>
                        <span className="mr-2">✓</span>
                        Mark as {place.visited ? 'Not Visited' : 'Visited'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onTogglePlanned(place.id, !place.visitPlanned)}>
                        <span className="mr-2">📅</span>
                        {place.visitPlanned ? 'Remove from Plan' : 'Add to Plan'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleRemovePlace(place.id)} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="line-clamp-1">
                  {place.district} District
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pb-2">
                <div className="flex items-center justify-between text-sm mb-2">
                  <div className="flex items-center">
                    <StarRating value={place.rating} readOnly size="sm" />
                    <span className="ml-1 text-muted-foreground">
                      ({place.reviewCount})
                    </span>
                  </div>
                  <span className="text-sm font-medium">
                    {formatPriceLevel(place.priceLevel)}
                  </span>
                </div>
                
                <div className="flex space-x-1">
                  {place.visited && (
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                      Visited
                    </Badge>
                  )}
                  {place.visitPlanned && (
                    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                      Planned
                    </Badge>
                  )}
                </div>
                
                {place.userNote && (
                  <div className="mt-2 text-sm text-muted-foreground line-clamp-2 italic">
                    "{place.userNote}"
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="pt-0">
                <Button className="w-full" variant="outline">
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* List view */}
      {viewMode === 'list' && filteredPlaces.length > 0 && (
        <div className="space-y-2">
          {filteredPlaces.map((place) => (
            <div key={place.id} className="flex border rounded-lg overflow-hidden">
              {/* Place image (smaller in list view) */}
              <div className="h-32 w-32 relative shrink-0">
                {place.imageUrl ? (
                  <img 
                    src={place.imageUrl} 
                    alt={place.title} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground">No image</span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2">
                  <Badge className="bg-background/80 text-foreground backdrop-blur-sm text-xs">
                    {placeTypeNames[place.placeType]}
                  </Badge>
                </div>
              </div>
              
              <div className="flex-grow p-4 flex flex-col">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{place.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {place.district} District · {formatPriceLevel(place.priceLevel)}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <StarRating value={place.rating} readOnly size="sm" />
                    <span className="ml-1 text-sm text-muted-foreground">
                      ({place.reviewCount})
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-1 mt-2">
                  {place.visited && (
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                      Visited
                    </Badge>
                  )}
                  {place.visitPlanned && (
                    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                      Planned
                    </Badge>
                  )}
                </div>
                
                {place.userNote && (
                  <p className="mt-2 text-sm italic text-muted-foreground line-clamp-1">
                    "{place.userNote}"
                  </p>
                )}
                
                <div className="mt-auto pt-2 flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    Saved {new Date(place.savedDate).toLocaleDateString()}
                  </p>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setEditingNote({ id: place.id, note: place.userNote || '' })}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Note
                    </Button>
                    <Button 
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRemovePlace(place.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Note editing dialog */}
      <Dialog
        open={editingNote !== null}
        onOpenChange={(open) => {
          if (!open) setEditingNote(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a Personal Note</DialogTitle>
            <DialogDescription>
              Add your own notes about this place to remember for later.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="note" className="mb-2 block">Your Note</Label>
            <Textarea
              id="note"
              ref={noteInputRef}
              placeholder="What do you want to remember about this place?"
              value={editingNote?.note || ''}
              onChange={(e) => {
                if (editingNote) {
                  setEditingNote({ ...editingNote, note: e.target.value });
                }
              }}
              className="min-h-[120px]"
            />
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleNoteUpdate}>Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 