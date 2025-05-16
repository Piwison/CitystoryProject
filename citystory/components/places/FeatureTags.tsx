'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface Feature {
  id: string;
  name: string;
  type: string; // Category: 'amenity', 'cuisine', 'atmosphere', etc.
  description?: string;
}

interface FeatureTagsProps {
  features: Feature[];
  className?: string;
  limit?: number;
  showAll?: boolean;
  onShowMore?: () => void;
}

// Map feature types to colors
const typeColors: Record<string, string> = {
  amenity: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  cuisine: 'bg-green-100 text-green-800 hover:bg-green-200',
  atmosphere: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  accessibility: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
  specialty: 'bg-rose-100 text-rose-800 hover:bg-rose-200',
  default: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
};

export default function FeatureTags({
  features,
  className = '',
  limit = 0,
  showAll = false,
  onShowMore,
}: FeatureTagsProps) {
  // Group features by type
  const groupedFeatures = features.reduce<Record<string, Feature[]>>(
    (groups, feature) => {
      const type = feature.type || 'default';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(feature);
      return groups;
    },
    {}
  );

  // Determine what features to show
  const displayFeatures = limit && !showAll ? features.slice(0, limit) : features;
  const hasMore = limit > 0 && features.length > limit && !showAll;

  // Function to get the appropriate color class for a feature type
  const getColorClass = (type: string): string => {
    return typeColors[type] || typeColors.default;
  };

  // Show grouped features if no limit or showing all
  if (!limit || showAll) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Object.entries(groupedFeatures).map(([type, typeFeatures]) => (
          <div key={type} className="space-y-2">
            <h4 className="text-sm font-medium capitalize">{type}</h4>
            <div className="flex flex-wrap gap-2">
              {typeFeatures.map((feature) => (
                <FeatureTag 
                  key={feature.id} 
                  feature={feature} 
                  colorClass={getColorClass(type)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Show flat list with limit
  return (
    <div className={`${className}`}>
      <div className="flex flex-wrap gap-2">
        {displayFeatures.map((feature) => (
          <FeatureTag 
            key={feature.id} 
            feature={feature} 
            colorClass={getColorClass(feature.type)}
          />
        ))}
        {hasMore && (
          <Badge 
            variant="outline" 
            className="cursor-pointer bg-white hover:bg-gray-50"
            onClick={onShowMore}
          >
            +{features.length - limit} more
          </Badge>
        )}
      </div>
    </div>
  );
}

// Individual feature tag with tooltip
function FeatureTag({ feature, colorClass }: { feature: Feature; colorClass: string }) {
  if (feature.description) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`${colorClass} cursor-help`}>
              {feature.name}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-sm">{feature.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Badge variant="outline" className={colorClass}>
      {feature.name}
    </Badge>
  );
} 