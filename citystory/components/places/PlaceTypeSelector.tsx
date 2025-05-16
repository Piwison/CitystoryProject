'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

export interface PlaceType {
  id: string;
  label: string;
  icon: string;
  description: string;
}

interface PlaceTypeSelectorProps {
  name: string; // Form field name
  types?: PlaceType[];
  onChange?: (type: string) => void;
}

// Default place types if none provided
const defaultPlaceTypes: PlaceType[] = [
  {
    id: 'restaurant',
    label: 'Restaurant',
    icon: '🍽️',
    description: 'A place where meals are prepared and served to customers',
  },
  {
    id: 'cafe',
    label: 'Cafe',
    icon: '☕',
    description: 'A small establishment serving coffee, light meals, and refreshments',
  },
  {
    id: 'bar',
    label: 'Bar',
    icon: '🍸',
    description: 'An establishment serving alcoholic beverages and sometimes food',
  },
  {
    id: 'hotel',
    label: 'Hotel',
    icon: '🏨',
    description: 'An establishment providing accommodation, meals, and other services',
  },
  {
    id: 'attraction',
    label: 'Attraction',
    icon: '🏛️',
    description: 'A place of interest such as a monument, museum, or natural feature',
  },
  {
    id: 'shopping',
    label: 'Shopping',
    icon: '🛍️',
    description: 'A retail establishment or shopping district',
  },
];

export default function PlaceTypeSelector({
  name,
  types = defaultPlaceTypes,
  onChange,
}: PlaceTypeSelectorProps) {
  const form = useFormContext();
  
  const handleTypeChange = (type: string) => {
    // Trigger the parent component onChange callback if provided
    if (onChange) {
      onChange(type);
    }
  };

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-4">
          <FormLabel className="text-base font-medium">Place Type</FormLabel>
          <FormControl>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {types.map((type) => (
                <TypeCard
                  key={type.id}
                  type={type}
                  selected={field.value === type.id}
                  onSelect={() => {
                    field.onChange(type.id);
                    handleTypeChange(type.id);
                  }}
                />
              ))}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Individual type card component
interface TypeCardProps {
  type: PlaceType;
  selected: boolean;
  onSelect: () => void;
}

function TypeCard({ type, selected, onSelect }: TypeCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
        selected
          ? 'border-primary bg-primary/5'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      {selected && (
        <div className="absolute top-2 right-2 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
      <span className="text-2xl mb-2" role="img" aria-label={type.label}>
        {type.icon}
      </span>
      <span className="font-medium text-center">{type.label}</span>
      <p className="text-xs text-gray-500 text-center mt-1 line-clamp-2">
        {type.description}
      </p>
    </motion.div>
  );
} 