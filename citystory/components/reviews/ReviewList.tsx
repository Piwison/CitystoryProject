'use client';

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronUp, ThumbsUp, Star } from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ui/star-rating';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getUserDisplayName, getUserInitials } from "@/lib/utils"

type PlaceType = 'restaurant' | 'cafe' | 'bar' | 'hotel' | 'attraction' | 'shopping';

export interface Review {
  id: string;
  placeId: string;
  userId: string;
  authorName: string;
  authorAvatar?: string;
  authorLevel?: string;
  overall_rating: number;
  food_quality?: number;
  service?: number;
  value?: number;
  atmosphere?: number;
  cleanliness?: number;
  comfort?: number;
  variety?: number;
  comment: string;
  visitDate?: string;
  createdAt: string;
  helpful_count: number;
  userHasMarkedHelpful?: boolean;
}

interface ReviewListProps {
  reviews: Review[];
  placeType: PlaceType;
  onHelpfulToggle?: (reviewId: string, isHelpful: boolean) => Promise<void>;
}

export default function ReviewList({
  reviews,
  placeType,
  onHelpfulToggle,
}: ReviewListProps) {
  const [sortOption, setSortOption] = useState('newest');
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
  // State for helpful vote loading and error
  const [helpfulLoading, setHelpfulLoading] = useState<string | null>(null);
  const [helpfulError, setHelpfulError] = useState<string | null>(null);

  // Sort reviews based on selected option
  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortOption) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'highest':
        return b.overall_rating - a.overall_rating;
      case 'lowest':
        return a.overall_rating - b.overall_rating;
      case 'helpful':
        return b.helpful_count - a.helpful_count;
      default:
        return 0;
    }
  });

  const toggleExpandReview = (reviewId: string) => {
    setExpandedReviews(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  const handleHelpfulToggle = async (reviewId: string, currentState: boolean) => {
    if (onHelpfulToggle) {
      setHelpfulLoading(reviewId);
      setHelpfulError(null);
      try {
        await onHelpfulToggle(reviewId, !currentState);
      } catch (error: any) {
        setHelpfulError(error.message || 'Failed to update helpful vote.');
      } finally {
        setHelpfulLoading(null);
      }
    }
  };

  // Get place-specific rating fields based on place type
  const getRatingFields = (review: Review) => {
    if (placeType === 'restaurant' || placeType === 'cafe' || placeType === 'bar') {
      return (
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-3">
          {review.food_quality && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Food Quality</span>
              <StarRating value={review.food_quality} readOnly size="sm" onChange={() => {}} />
            </div>
          )}
          {review.service && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Service</span>
              <StarRating value={review.service} readOnly size="sm" onChange={() => {}} />
            </div>
          )}
          {review.value && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Value</span>
              <StarRating value={review.value} readOnly size="sm" onChange={() => {}} />
            </div>
          )}
          {review.atmosphere && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Atmosphere</span>
              <StarRating value={review.atmosphere} readOnly size="sm" onChange={() => {}} />
            </div>
          )}
        </div>
      );
    } else if (placeType === 'hotel') {
      return (
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-3">
          {review.cleanliness && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cleanliness</span>
              <StarRating value={review.cleanliness} readOnly size="sm" onChange={() => {}} />
            </div>
          )}
          {review.comfort && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Comfort</span>
              <StarRating value={review.comfort} readOnly size="sm" onChange={() => {}} />
            </div>
          )}
          {review.service && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Service</span>
              <StarRating value={review.service} readOnly size="sm" onChange={() => {}} />
            </div>
          )}
          {review.value && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Value</span>
              <StarRating value={review.value} readOnly size="sm" onChange={() => {}} />
            </div>
          )}
        </div>
      );
    } else if (placeType === 'shopping') {
      return (
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-3">
          {review.service && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Service</span>
              <StarRating value={review.service} readOnly size="sm" onChange={() => {}} />
            </div>
          )}
          {review.value && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Value</span>
              <StarRating value={review.value} readOnly size="sm" onChange={() => {}} />
            </div>
          )}
          {review.variety && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Variety</span>
              <StarRating value={review.variety} readOnly size="sm" onChange={() => {}} />
            </div>
          )}
        </div>
      );
    }
    
    // For attractions, we don't show detailed ratings (only overall)
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Reviews {reviews.length > 0 && <span>({reviews.length})</span>}
        </h2>
        
        <Select value={sortOption} onValueChange={setSortOption}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="highest">Highest rated</SelectItem>
            <SelectItem value="lowest">Lowest rated</SelectItem>
            <SelectItem value="helpful">Most helpful</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {helpfulError && (
        <div className="bg-red-100 text-red-700 p-2 rounded text-center mb-2">{helpfulError}</div>
      )}
      {reviews.length === 0 ? (
        <Card className="bg-gray-50">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500">No reviews yet. Be the first to share your experience!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedReviews.map((review) => {
            const isExpanded = expandedReviews[review.id] || false;
            const commentLength = review.comment.length;
            const shouldShowToggle = commentLength > 250;
            const displayComment = shouldShowToggle && !isExpanded
              ? `${review.comment.substring(0, 250)}...`
              : review.comment;
            
            return (
              <Card key={review.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={review.authorAvatar} alt={getUserDisplayName({ name: review.authorName })} />
                        <AvatarFallback>
                          {getUserInitials({ name: review.authorName })}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{getUserDisplayName({ name: review.authorName })}</div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div>
                            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                          </div>
                          {review.authorLevel && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                {review.authorLevel}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <StarRating 
                      value={review.overall_rating} 
                      readOnly 
                      size="sm" 
                      onChange={() => {}} 
                    />
                  </div>
                </CardHeader>
                
                <CardContent className="pb-3">
                  {/* Detailed ratings based on place type */}
                  {getRatingFields(review)}
                  
                  {/* Review comment */}
                  <div className="mt-4">
                    <p className="text-gray-800">{displayComment}</p>
                    
                    {shouldShowToggle && (
                      <Button
                        variant="ghost"
                        className="p-0 h-auto mt-2 text-primary hover:text-primary/80 hover:bg-transparent"
                        onClick={() => toggleExpandReview(review.id)}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1" />
                            Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            Read more
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="pt-0">
                  <div className="flex items-center justify-between w-full">
                    <div className="text-sm text-gray-500">
                      {review.visitDate && (
                        <span>Visited {new Date(review.visitDate).toLocaleDateString()}</span>
                      )}
                    </div>
                    
                    {onHelpfulToggle && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={
                          review.userHasMarkedHelpful
                            ? "text-primary hover:text-primary/80"
                            : "text-gray-500 hover:text-gray-600"
                        }
                        onClick={() => handleHelpfulToggle(review.id, !!review.userHasMarkedHelpful)}
                        disabled={helpfulLoading === review.id}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        {helpfulLoading === review.id ? (
                          <span className="animate-spin inline-block mr-1 w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full align-middle"></span>
                        ) : null}
                        Helpful {review.helpful_count > 0 && `(${review.helpful_count})`}
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
} 