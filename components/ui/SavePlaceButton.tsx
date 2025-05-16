'use client';

import React from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button'; // Assuming ButtonProps is exported or use React.ComponentProps<typeof Button>
import { useGetSavedPlaces, useAddSavedPlace, useRemoveSavedPlace } from '@/hooks/useSavedPlaces';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext'; // To get userId

interface SavePlaceButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  placeId: string;
  placeTitle?: string; // For toast messages
  // userId is now derived from AuthContext
}

export const SavePlaceButton: React.FC<SavePlaceButtonProps> = ({ 
  placeId, 
  placeTitle = 'this place',
  variant = 'ghost', 
  size = 'icon', 
  className,
  ...props 
}) => {
  const { user } = useAuth();
  const userId = user?.id;
  const { toast } = useToast();

  const { data: savedPlaces, isLoading: isLoadingSavedStatus } = useGetSavedPlaces(userId);
  const addMutation = useAddSavedPlace();
  const removeMutation = useRemoveSavedPlace();

  const isCurrentlySaving = addMutation.isLoading || removeMutation.isLoading;

  const savedPlaceEntry = React.useMemo(() => {
    if (!userId || !savedPlaces) return undefined;
    return savedPlaces.find(sp => sp.placeId === placeId);
  }, [savedPlaces, placeId, userId]);

  const isSaved = !!savedPlaceEntry;

  const handleToggleSave = async () => {
    if (!userId) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to save places.',
        variant: 'destructive',
      });
      return;
    }

    if (isCurrentlySaving) return;

    if (isSaved && savedPlaceEntry) {
      removeMutation.mutate(
        { userId, savedPlaceId: savedPlaceEntry.savedPlaceId },
        {
          onSuccess: () => {
            toast({ title: 'Removed from Saved', description: `${placeTitle} has been removed from your saved places.` });
          },
          onError: (error) => {
            toast({ title: 'Error Removing Place', description: error.message || 'Could not remove from saved places.', variant: 'destructive' });
          },
        }
      );
    } else {
      addMutation.mutate(
        { userId, placeId, notes: '' }, // Default notes, can be expanded later
        {
          onSuccess: () => {
            toast({ title: 'Saved!', description: `${placeTitle} has been added to your saved places.` });
          },
          onError: (error) => {
            toast({ title: 'Error Saving Place', description: error.message || 'Could not save this place.', variant: 'destructive' });
          },
        }
      );
    }
  };

  if (!userId || isLoadingSavedStatus) {
    // Render a disabled or loading state if userId is not available or saved status is loading
    // You might want a skeleton loader or a more subtle loading indicator here
    return (
      <Button variant={variant} size={size} className={className} disabled {...props}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }
  
  const tooltipText = isSaved ? 'Remove from saved places' : 'Save this place';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={className}
            onClick={handleToggleSave}
            disabled={isCurrentlySaving}
            aria-label={tooltipText}
            {...props}
          >
            {isCurrentlySaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}; 