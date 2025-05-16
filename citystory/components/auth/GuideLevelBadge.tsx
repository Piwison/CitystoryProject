'use client';

import React from 'react';
import { Progress } from '../ui/progress';

interface GuideLevelBadgeProps {
  level: number;
  currentPoints: number;
  nextLevelPoints: number;
  className?: string;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const levelColors = {
  1: 'bg-zinc-300 text-zinc-800', // Newcomer
  2: 'bg-emerald-300 text-emerald-800', // Explorer 
  3: 'bg-blue-300 text-blue-800', // Guide
  4: 'bg-purple-300 text-purple-800', // Expert
  5: 'bg-amber-300 text-amber-800', // Legend
};

const levelNames = {
  1: 'Newcomer',
  2: 'Explorer',
  3: 'Guide',
  4: 'Expert',
  5: 'Legend',
};

const getLevelColor = (level: number): string => {
  return levelColors[level as keyof typeof levelColors] || levelColors[1];
};

const getLevelName = (level: number): string => {
  return levelNames[level as keyof typeof levelNames] || levelNames[1];
};

export default function GuideLevelBadge({
  level,
  currentPoints,
  nextLevelPoints,
  className = '',
  showProgress = true,
  size = 'md',
}: GuideLevelBadgeProps) {
  const progress = Math.min(
    Math.floor((currentPoints / nextLevelPoints) * 100),
    100
  );
  
  const sizeClasses = {
    sm: 'text-xs py-0.5 px-2',
    md: 'text-sm py-1 px-3',
    lg: 'text-base py-1.5 px-4',
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center gap-2">
        <span
          className={`font-medium rounded-full ${getLevelColor(level)} ${sizeClasses[size]}`}
        >
          {getLevelName(level)}
        </span>
        {showProgress && (
          <span className="text-xs text-gray-500">
            {currentPoints} / {nextLevelPoints} points
          </span>
        )}
      </div>
      
      {showProgress && (
        <div className="mt-1">
          <Progress value={progress} className="h-1.5" />
        </div>
      )}
    </div>
  );
} 