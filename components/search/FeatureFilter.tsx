'use client';

import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Types for place features
type FeatureCategory = 'Amenities' | 'Accessibility' | 'Atmosphere' | 'Services' | 'Facilities';

interface Feature {
  id: string;
  name: string;
  category: FeatureCategory;
  description?: string;
}

// Sample features by category
const features: Record<FeatureCategory, Feature[]> = {
  'Amenities': [
    { id: 'wifi', name: 'Free WiFi', category: 'Amenities', description: 'High-speed internet access' },
    { id: 'parking', name: 'Parking', category: 'Amenities', description: 'On-site parking available' },
    { id: 'air-conditioning', name: 'Air Conditioning', category: 'Amenities' },
    { id: 'outdoor-seating', name: 'Outdoor Seating', category: 'Amenities' },
  ],
  'Accessibility': [
    { id: 'wheelchair', name: 'Wheelchair Accessible', category: 'Accessibility' },
    { id: 'elevator', name: 'Elevator', category: 'Accessibility' },
    { id: 'accessible-bathroom', name: 'Accessible Bathroom', category: 'Accessibility' },
  ],
  'Atmosphere': [
    { id: 'quiet', name: 'Quiet', category: 'Atmosphere', description: 'Good for working/studying' },
    { id: 'romantic', name: 'Romantic', category: 'Atmosphere', description: 'Perfect for couples' },
    { id: 'lively', name: 'Lively', category: 'Atmosphere', description: 'Vibrant atmosphere' },
    { id: 'family-friendly', name: 'Family Friendly', category: 'Atmosphere' },
  ],
  'Services': [
    { id: 'reservations', name: 'Reservations', category: 'Services' },
    { id: 'delivery', name: 'Delivery', category: 'Services' },
    { id: 'takeout', name: 'Takeout', category: 'Services' },
    { id: 'table-service', name: 'Table Service', category: 'Services' },
  ],
  'Facilities': [
    { id: 'private-room', name: 'Private Room', category: 'Facilities' },
    { id: 'smoking-area', name: 'Smoking Area', category: 'Facilities' },
    { id: 'rooftop', name: 'Rooftop', category: 'Facilities', description: 'Offers rooftop seating or views' },
    { id: 'pet-friendly', name: 'Pet Friendly', category: 'Facilities' },
  ],
};

// All feature categories
const allCategories: FeatureCategory[] = [
  'Amenities', 'Accessibility', 'Atmosphere', 'Services', 'Facilities'
];

// Get all features as a flat array
const getAllFeatures = (): Feature[] => {
  return Object.values(features).flat();
};

interface FeatureFilterProps {
  selectedFeatures: string[];
  onChange: (features: string[]) => void;
  className?: string;
}

export function FeatureFilter({
  selectedFeatures,
  onChange,
  className,
}: FeatureFilterProps) {
  const [expandedCategories, setExpandedCategories] = useState<FeatureCategory[]>([]);
  
  // Toggle category expansion
  const toggleCategory = (category: FeatureCategory) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };
  
  // Toggle feature selection
  const toggleFeature = (featureId: string) => {
    onChange(
      selectedFeatures.includes(featureId)
        ? selectedFeatures.filter(id => id !== featureId)
        : [...selectedFeatures, featureId]
    );
  };
  
  // Remove a feature from selection
  const removeFeature = (featureId: string) => {
    onChange(selectedFeatures.filter(id => id !== featureId));
  };
  
  // Clear all selected features
  const clearAll = () => {
    onChange([]);
  };
  
  // Find feature by ID
  const getFeatureById = (id: string): Feature | undefined => {
    return getAllFeatures().find(feature => feature.id === id);
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Features</h3>
          {selectedFeatures.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 text-xs"
              onClick={clearAll}
            >
              Clear all
            </Button>
          )}
        </div>
        
        {/* Category sections */}
        <div className="space-y-2">
          {allCategories.map((category) => {
            const isExpanded = expandedCategories.includes(category);
            const categoryFeatures = features[category];
            
            return (
              <div key={category} className="space-y-2">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleCategory(category)}
                >
                  <span className="text-sm font-medium">{category}</span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
                
                {isExpanded && (
                  <div className="grid grid-cols-1 gap-2 ml-2">
                    {categoryFeatures.map((feature) => (
                      <div key={feature.id} className="flex items-start space-x-2">
                        <Checkbox
                          id={`feature-${feature.id}`}
                          checked={selectedFeatures.includes(feature.id)}
                          onCheckedChange={() => toggleFeature(feature.id)}
                        />
                        <div className="grid gap-1">
                          <label
                            htmlFor={`feature-${feature.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {feature.name}
                          </label>
                          {feature.description && (
                            <p className="text-xs text-muted-foreground">
                              {feature.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {category !== allCategories[allCategories.length - 1] && (
                  <Separator className="my-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Display selected features as badges */}
      {selectedFeatures.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-4">
          {selectedFeatures.map((featureId) => {
            const feature = getFeatureById(featureId);
            if (!feature) return null;
            
            return (
              <Badge
                key={featureId}
                variant="secondary"
                className="capitalize"
              >
                {feature.name}
                <button
                  type="button"
                  className="ml-1 rounded-full"
                  onClick={() => removeFeature(featureId)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {feature.name}</span>
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
} 