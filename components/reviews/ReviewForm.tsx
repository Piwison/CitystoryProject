'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@/components/ui/star-rating';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

// Define review schema with conditional fields based on place type
const baseReviewSchema = {
  overallRating: z.number().min(1, "Overall rating is required"),
  comment: z.string().min(3, "Please share some details about your experience").max(1000, "Comment is too long"),
  visitDate: z.string().optional(),
};

// Additional fields for food-related places (restaurants, cafes, bars)
const foodPlaceFields = {
  foodQuality: z.number().min(1, "Food quality rating is required"),
  service: z.number().min(1, "Service rating is required"),
  value: z.number().min(1, "Value rating is required"),
  atmosphere: z.number().min(1, "Atmosphere rating is required"),
};

// Additional fields for hotels
const hotelFields = {
  cleanliness: z.number().min(1, "Cleanliness rating is required"),
  comfort: z.number().min(1, "Comfort rating is required"),
  service: z.number().min(1, "Service rating is required"),
  value: z.number().min(1, "Value rating is required"),
};

// Additional fields for attractions
const attractionFields = {
  // Attractions only use overall rating
};

// Additional fields for shopping
const shoppingFields = {
  service: z.number().min(1, "Service rating is required"),
  value: z.number().min(1, "Value rating is required"),
  variety: z.number().min(1, "Variety rating is required"),
};

type PlaceType = 'restaurant' | 'cafe' | 'bar' | 'hotel' | 'attraction' | 'shopping';

// Function to create dynamic schema based on place type
const createReviewSchema = (placeType: PlaceType) => {
  let schema = { ...baseReviewSchema };
  
  if (placeType === 'restaurant' || placeType === 'cafe' || placeType === 'bar') {
    schema = { ...schema, ...foodPlaceFields };
  } else if (placeType === 'hotel') {
    schema = { ...schema, ...hotelFields };
  } else if (placeType === 'shopping') {
    schema = { ...schema, ...shoppingFields };
  }
  // For attraction type, we only use the base schema

  return z.object(schema);
};

interface ReviewFormProps {
  placeType: PlaceType;
  placeId: string;
  placeTitle: string;
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
  initialData?: any;
}

export function ReviewForm({
  placeType,
  placeId,
  placeTitle,
  onSubmit,
  onCancel,
  initialData
}: ReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Create dynamic schema based on place type
  const reviewSchema = createReviewSchema(placeType);
  type ReviewFormData = z.infer<typeof reviewSchema>;
  
  // Get default values for this place type
  const getDefaultValues = () => {
    const baseValues = {
      overallRating: initialData?.overallRating || 0,
      comment: initialData?.comment || '',
      visitDate: initialData?.visitDate || '',
    };
    
    if (placeType === 'restaurant' || placeType === 'cafe' || placeType === 'bar') {
      return {
        ...baseValues,
        foodQuality: initialData?.foodQuality || 0,
        service: initialData?.service || 0,
        value: initialData?.value || 0,
        atmosphere: initialData?.atmosphere || 0,
      };
    } else if (placeType === 'hotel') {
      return {
        ...baseValues,
        cleanliness: initialData?.cleanliness || 0,
        comfort: initialData?.comfort || 0,
        service: initialData?.service || 0,
        value: initialData?.value || 0,
      };
    } else if (placeType === 'shopping') {
      return {
        ...baseValues,
        service: initialData?.service || 0,
        value: initialData?.value || 0,
        variety: initialData?.variety || 0,
      };
    }
    
    // For attractions, just return base values
    return baseValues;
  };

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: getDefaultValues(),
  });

  const handleSubmit = async (data: ReviewFormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit({
        ...data,
        placeId,
        placeType,
      });
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get proper title based on place type
  const getFormTitle = () => {
    if (placeType === 'restaurant' || placeType === 'cafe' || placeType === 'bar') {
      return `Rate your dining experience at ${placeTitle}`;
    } else if (placeType === 'hotel') {
      return `Rate your stay at ${placeTitle}`;
    } else if (placeType === 'attraction') {
      return `Rate your visit to ${placeTitle}`;
    } else if (placeType === 'shopping') {
      return `Rate your shopping experience at ${placeTitle}`;
    }
    return `Rate your experience at ${placeTitle}`;
  };

  // Dynamic description based on place type
  const getFormDescription = () => {
    if (placeType === 'attraction') {
      return "Share your overall experience visiting this attraction";
    } else if (placeType === 'restaurant' || placeType === 'cafe' || placeType === 'bar') {
      return "Rate the food, service, and overall experience";
    } else if (placeType === 'hotel') {
      return "Rate the comfort, cleanliness, and overall experience";
    } else if (placeType === 'shopping') {
      return "Rate the service, variety, and overall experience";
    }
    return "Share your experience with others";
  };
  
  // Custom rating field component
  const RatingField = ({ name, label }: { name: string; label: string }) => (
    <FormField
      control={form.control}
      name={name as any}
      render={({ field }) => (
        <FormItem className="space-y-2">
          <div className="flex justify-between items-center">
            <FormLabel>{label}</FormLabel>
            <FormMessage />
          </div>
          <FormControl>
            <StarRating 
              value={field.value} 
              onChange={field.onChange}
              size="md"
              className="justify-start"
            />
          </FormControl>
        </FormItem>
      )}
    />
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{getFormTitle()}</CardTitle>
        <CardDescription>{getFormDescription()}</CardDescription>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {/* Always show overall rating for all place types */}
              <RatingField name="overallRating" label="Overall Experience" />
              
              {/* Food-specific ratings */}
              {(placeType === 'restaurant' || placeType === 'cafe' || placeType === 'bar') && (
                <>
                  <RatingField name="foodQuality" label="Food Quality" />
                  <RatingField name="service" label="Service" />
                  <RatingField name="value" label="Value for Money" />
                  <RatingField name="atmosphere" label="Atmosphere" />
                </>
              )}
              
              {/* Hotel-specific ratings */}
              {placeType === 'hotel' && (
                <>
                  <RatingField name="cleanliness" label="Cleanliness" />
                  <RatingField name="comfort" label="Comfort" />
                  <RatingField name="service" label="Service" />
                  <RatingField name="value" label="Value for Money" />
                </>
              )}
              
              {/* Shopping-specific ratings */}
              {placeType === 'shopping' && (
                <>
                  <RatingField name="service" label="Customer Service" />
                  <RatingField name="value" label="Value for Money" />
                  <RatingField name="variety" label="Product Variety" />
                </>
              )}
              
              {/* No additional fields for attractions */}
              
              {/* Comment field for all types */}
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Review</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Share your experience with other travelers..."
                        className="min-h-[120px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Your review helps others make better choices
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Optional visit date */}
              <FormField
                control={form.control}
                name="visitDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>When did you visit? (Optional)</FormLabel>
                    <FormControl>
                      <input
                        type="date"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Review'
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
} 