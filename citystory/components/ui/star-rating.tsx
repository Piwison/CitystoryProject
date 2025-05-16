'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function StarRating({
  value,
  onChange,
  readOnly = false,
  max = 5,
  size = 'md',
  className,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  
  const renderStar = (index: number) => {
    const filled = (hoverValue !== null ? hoverValue : value) >= index + 1;
    
    const starClass = cn(
      sizeClasses[size],
      'transition-all',
      filled ? 'fill-yellow-400 text-yellow-400' : 'fill-transparent text-gray-300',
      !readOnly && 'cursor-pointer hover:scale-110'
    );
    
    return (
      <Star
        key={index}
        className={starClass}
        onClick={() => {
          if (!readOnly && onChange) {
            onChange(index + 1);
          }
        }}
        onMouseEnter={() => {
          if (!readOnly) {
            setHoverValue(index + 1);
          }
        }}
        onMouseLeave={() => {
          if (!readOnly) {
            setHoverValue(null);
          }
        }}
      />
    );
  };
  
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: max }).map((_, index) => renderStar(index))}
    </div>
  );
} 