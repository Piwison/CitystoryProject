import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult, QueryKey } from '@tanstack/react-query';
import {
  getSavedPlaces as apiGetSavedPlaces,
  addSavedPlace as apiAddSavedPlace,
  updateSavedPlaceNotes as apiUpdateSavedPlaceNotes,
  removeSavedPlace as apiRemoveSavedPlace,
} from '@/lib/api/services/savedPlacesService';
import { SavedPlace, ApiError, PlaceSearchResult } from '@/types';

const savedPlacesQueryKey = (userId: string): QueryKey => ['savedPlaces', userId];

/**
 * Hook to fetch saved places for a user.
 */
export const useGetSavedPlaces = (userId: string | undefined): UseQueryResult<SavedPlace[], ApiError> => {
  return useQuery<SavedPlace[], ApiError, SavedPlace[], QueryKey>(
    savedPlacesQueryKey(userId || ''),
    () => apiGetSavedPlaces(userId!),
    {
      enabled: !!userId, // Only fetch if userId is provided
      // staleTime: 1000 * 60 * 5, // Example: 5 minutes
    }
  );
};

interface AddSavedPlaceVariables {
  userId: string;
  placeId: string;
  notes?: string;
}

/**
 * Hook to add a place to saved list.
 */
export const useAddSavedPlace = (): UseMutationResult<SavedPlace, ApiError, AddSavedPlaceVariables> => {
  const queryClient = useQueryClient();
  return useMutation<SavedPlace, ApiError, AddSavedPlaceVariables>(
    ({ userId, placeId, notes }: AddSavedPlaceVariables) => apiAddSavedPlace(userId, placeId, notes),
    {
      onSuccess: (newlySavedPlace: SavedPlace, variables: AddSavedPlaceVariables) => {
        // Invalidate and refetch saved places list to include the new one
        queryClient.invalidateQueries(savedPlacesQueryKey(variables.userId));
        
        // Optimistically update the list of saved places
        queryClient.setQueryData<SavedPlace[]>(savedPlacesQueryKey(variables.userId), (oldData: SavedPlace[] | undefined) => {
          return oldData ? [...oldData, newlySavedPlace] : [newlySavedPlace];
        });
      },
      // onError: (error, variables, context) => { ... }
    }
  );
};

interface UpdateNotesVariables {
  userId: string;
  savedPlaceId: string;
  notes: string;
}

/**
 * Hook to update notes for a saved place.
 */
export const useUpdateSavedPlaceNotes = (): UseMutationResult<SavedPlace, ApiError, UpdateNotesVariables> => {
  const queryClient = useQueryClient();
  return useMutation<SavedPlace, ApiError, UpdateNotesVariables>(
    ({ userId, savedPlaceId, notes }: UpdateNotesVariables) => apiUpdateSavedPlaceNotes(userId, savedPlaceId, notes),
    {
      onSuccess: (updatedSavedPlace: SavedPlace, variables: UpdateNotesVariables) => {
        queryClient.invalidateQueries(savedPlacesQueryKey(variables.userId));
        // Optimistically update the specific saved place in the list
        queryClient.setQueryData<SavedPlace[]>(savedPlacesQueryKey(variables.userId), (oldData: SavedPlace[] | undefined) => 
          oldData?.map(sp => sp.savedPlaceId === updatedSavedPlace.savedPlaceId ? updatedSavedPlace : sp) || []
        );
      },
    }
  );
};

interface RemoveSavedPlaceVariables {
  userId: string;
  savedPlaceId: string;
}

/**
 * Hook to remove a place from saved list.
 */
export const useRemoveSavedPlace = (): UseMutationResult<void, ApiError, RemoveSavedPlaceVariables> => {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, RemoveSavedPlaceVariables>(
    ({ userId, savedPlaceId }: RemoveSavedPlaceVariables) => apiRemoveSavedPlace(userId, savedPlaceId),
    {
      onSuccess: (data: void, variables: RemoveSavedPlaceVariables) => {
        queryClient.invalidateQueries(savedPlacesQueryKey(variables.userId));
        // Optimistically remove the saved place from the list
        queryClient.setQueryData<SavedPlace[]>(savedPlacesQueryKey(variables.userId), (oldData: SavedPlace[] | undefined) => 
          oldData?.filter(sp => sp.savedPlaceId !== variables.savedPlaceId) || []
        );
      },
    }
  );
}; 