import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryKey,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query';
import {
  getManagedPlaceDetails,
  createPlace,
  updatePlace,
  deletePlace,
  getManagedPlaces,
} from '@/lib/api/services/placeManagementService';
import {
  PlaceType,
  PlaceCreationPayload,
  PlaceUpdatePayload,
  ManagedPlace,
  ApiError,
} from '@/types';

// Query Keys Factory
const placeManagementKeys = {
  all: ['placeManagement'] as const,
  lists: () => [...placeManagementKeys.all, 'lists'] as const,
  list: (userId: string) => [...placeManagementKeys.lists(), { userId }] as const,
  details: () => [...placeManagementKeys.all, 'details'] as const,
  detail: (placeId: string) => [...placeManagementKeys.details(), placeId] as const,
};

// Hook to get details of a specific managed place
export function useGetManagedPlaceDetails(
  placeId: string,
  options?: Omit<UseQueryOptions<ManagedPlace, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<ManagedPlace, ApiError>({
    queryKey: placeManagementKeys.detail(placeId),
    queryFn: () => getManagedPlaceDetails(placeId),
    enabled: !!placeId, // Only run if placeId is provided
    ...options,
  });
}

// Hook to get a list of places managed by a user
export function useGetManagedPlaces(
  userId: string,
  options?: Omit<UseQueryOptions<ManagedPlace[], ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<ManagedPlace[], ApiError>({
    queryKey: placeManagementKeys.list(userId),
    queryFn: () => getManagedPlaces(userId),
    enabled: !!userId, // Only run if userId is provided
    ...options,
  });
}

// Hook to create a new place
export function useCreatePlace(
  options?: Omit<UseMutationOptions<PlaceType, ApiError, PlaceCreationPayload>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  return useMutation<PlaceType, ApiError, PlaceCreationPayload>({
    mutationFn: createPlace,
    onSuccess: (newPlace: PlaceType, variables: PlaceCreationPayload) => {
      // Invalidate and refetch the list of managed places for the user (if userId is available)
      // This is a common pattern, but depends on how you get the userId for the list invalidation
      // For now, let's invalidate all lists as a broader approach.
      queryClient.invalidateQueries({ queryKey: placeManagementKeys.lists() });
      // Optionally, you could also update the cache directly if you have the user's list
      // and add the newPlace to it.
      options?.onSuccess?.(newPlace, variables, undefined);
    },
    ...options,
  });
}

// Hook to update an existing place
export function useUpdatePlace(
  options?: Omit<UseMutationOptions<PlaceType, ApiError, { placeId: string; data: PlaceUpdatePayload }>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  return useMutation<PlaceType, ApiError, { placeId: string; data: PlaceUpdatePayload }>({
    mutationFn: ({ placeId, data }: { placeId: string; data: PlaceUpdatePayload }) => updatePlace(placeId, data),
    onSuccess: (updatedPlace: PlaceType, variables: { placeId: string; data: PlaceUpdatePayload }) => {
      // Invalidate the specific place detail query
      queryClient.invalidateQueries({ queryKey: placeManagementKeys.detail(variables.placeId) });
      // Invalidate all lists of managed places as the update might change its representation in lists
      queryClient.invalidateQueries({ queryKey: placeManagementKeys.lists() });
      options?.onSuccess?.(updatedPlace, variables, undefined);
    },
    ...options,
  });
}

// Hook to delete a place
export function useDeletePlace(
  options?: Omit<UseMutationOptions<void, ApiError, string /* placeId */>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string /* placeId */>({
    mutationFn: deletePlace,
    onSuccess: (data: void, placeId: string) => {
      // Invalidate the specific place detail query
      queryClient.invalidateQueries({ queryKey: placeManagementKeys.detail(placeId) });
      // Invalidate all lists of managed places
      queryClient.invalidateQueries({ queryKey: placeManagementKeys.lists() });
      options?.onSuccess?.(data, placeId, undefined);
    },
    ...options,
  });
} 