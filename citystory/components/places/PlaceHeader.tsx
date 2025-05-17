'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { BookmarkPlus, BookmarkCheck, Edit, Shield, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { StarRating } from '@/components/ui/star-rating';
import { useToast } from '@/components/ui/use-toast';
import { SavePlaceButton } from '../../../components/ui/SavePlaceButton';

export interface PlaceHeaderProps {
  id: string;
  name: string;
  type: string;
  district: string;
  address: string;
  rating: number;
  reviewCount: number;
  imageUrl?: string;
  hours?: string;
  isOwner?: boolean;
  moderationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  tags?: string[];
  priceLevel?: number;
}

export default function PlaceHeader({
  id,
  name,
  type,
  district,
  address,
  rating,
  reviewCount,
  imageUrl = '/placeholder.svg',
  hours,
  isOwner = false,
  moderationStatus = 'APPROVED',
  tags = [],
  priceLevel = 0,
}: PlaceHeaderProps) {
  const { data: session } = useSession();
  const { toast } = useToast();

  const priceString = priceLevel > 0 ? Array(priceLevel).fill('$').join('') : 'Free';

  const getModerationStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pending Approval';
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status;
    }
  };

  const getModerationStatusClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 mb-8">
      {/* Image */}
      <div className="relative h-48 w-full md:w-48 md:h-48 rounded-xl overflow-hidden flex-shrink-0">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Content */}
      <div className="flex-1">
        {/* Tags Row */}
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge variant="secondary">{type}</Badge>
          <Badge variant="outline" className="bg-blue-50">{district}</Badge>
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="border-gray-200">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-2">{name}</h1>

        {/* Ratings */}
        <div className="flex items-center mb-3">
          <StarRating value={rating} readOnly size="sm" />
          <span className="ml-2 text-sm text-gray-600">
            {rating.toFixed(1)} ({reviewCount} reviews)
          </span>
        </div>

        {/* Location and Price */}
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <MapPin className="h-4 w-4 mr-1 text-primary" />
          {address} • {priceString}
        </div>

        {/* Hours */}
        {hours && (
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <Clock className="h-4 w-4 mr-1 text-primary" />
            {hours}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-4">
          <SavePlaceButton placeId={id} placeTitle={name} />

          {isOwner && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/places/edit?id=${id}`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          )}

          {/* Moderation Status (only visible to owners) */}
          {isOwner && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className={getModerationStatusClass(moderationStatus)}>
                    <Shield className="h-3 w-3 mr-1" />
                    {getModerationStatusLabel(moderationStatus)}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {moderationStatus === 'PENDING'
                      ? 'Your place is being reviewed by moderators'
                      : moderationStatus === 'REJECTED'
                      ? 'Your place was rejected. Please edit and resubmit.'
                      : 'Your place is approved and visible to all users'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  );
} 