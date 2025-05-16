'use client';

import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';

interface PriceRangeSliderProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function PriceRangeSlider({
  value,
  onChange,
  min = 0,
  max = 4,
  step = 1,
  className,
}: PriceRangeSliderProps) {
  const [localValue, setLocalValue] = useState<[number, number]>(value);
  
  // Update local value when external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  // Handle slider change
  const handleChange = (newValue: number[]) => {
    const rangeValue: [number, number] = [newValue[0], newValue[1]];
    setLocalValue(rangeValue);
  };
  
  // Commit changes on slider release
  const handleChangeEnd = (newValue: number[]) => {
    const rangeValue: [number, number] = [newValue[0], newValue[1]];
    onChange(rangeValue);
  };
  
  // Generate price labels
  const getPriceLabel = (value: number): string => {
    if (value === 0) return 'Free';
    return '$'.repeat(value);
  };

  return (
    <div className={className}>
      <div className="mb-5">
        <div className="mb-4">
          <h3 className="font-medium mb-2">Price Range</h3>
          <Slider
            defaultValue={localValue}
            min={min}
            max={max}
            step={step}
            value={localValue}
            onValueChange={handleChange}
            onValueCommit={handleChangeEnd}
            minStepsBetweenThumbs={1}
          />
        </div>
        
        <div className="flex justify-between">
          <Badge variant="outline">{getPriceLabel(localValue[0])}</Badge>
          <Badge variant="outline">{getPriceLabel(localValue[1])}</Badge>
        </div>
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <div>{getPriceLabel(min)}</div>
        <div>{getPriceLabel(max)}</div>
      </div>
    </div>
  );
} 