'use client';

import React from 'react';
import { format } from 'date-fns';

export interface PointEvent {
  id: string;
  eventType: string;
  points: number;
  description: string;
  timestamp: string | Date;
}

interface GuidePointsHistoryProps {
  pointEvents: PointEvent[];
  className?: string;
}

// Maps event types to icons and colors
const eventTypeConfig: Record<string, { icon: string; color: string }> = {
  'place_contribution': { icon: '🏙️', color: 'text-blue-600' },
  'review_submission': { icon: '✍️', color: 'text-green-600' },
  'helpful_vote': { icon: '👍', color: 'text-amber-600' },
  'photo_upload': { icon: '📸', color: 'text-purple-600' },
  'level_up': { icon: '🎖️', color: 'text-red-600' },
  'badge_earned': { icon: '🏆', color: 'text-yellow-600' },
  'default': { icon: '⭐', color: 'text-gray-600' },
};

export default function GuidePointsHistory({
  pointEvents,
  className = '',
}: GuidePointsHistoryProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-medium">Points History</h3>
      
      {pointEvents.length === 0 ? (
        <p className="text-sm text-gray-500">No point history yet. Start contributing to earn points!</p>
      ) : (
        <ul className="space-y-3">
          {pointEvents.map((event) => {
            const config = eventTypeConfig[event.eventType] || eventTypeConfig.default;
            const formattedDate = typeof event.timestamp === 'string' 
              ? format(new Date(event.timestamp), 'MMM d, yyyy')
              : format(event.timestamp, 'MMM d, yyyy');
              
            return (
              <li key={event.id} className="flex items-start gap-3 pb-3 border-b border-gray-100">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                  <span className="text-lg">{config.icon}</span>
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="font-medium">{event.description}</p>
                    <span className={`font-semibold ${config.color}`}>+{event.points}</span>
                  </div>
                  <p className="text-xs text-gray-500">{formattedDate}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
} 