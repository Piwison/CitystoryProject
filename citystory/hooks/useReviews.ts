import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { submitReview, toggleHelpful } from '@/lib/api/services/reviewService';
import { ReviewPayload, Review, ApiError } from '@/types';

export function useSubmitReview(
  placeId: string,
  options?: Omit<UseMutationOptions<Review, ApiError, ReviewPayload>, 'mutationFn'>
) {
  return useMutation<Review, ApiError, ReviewPayload>({
    mutationFn: (data: ReviewPayload) => submitReview(placeId, data),
    ...options,
  });
}

export function useToggleHelpfulReview(
  placeId: string,
  options?: Omit<UseMutationOptions<void, ApiError, { reviewId: string; isHelpful: boolean }>, 'mutationFn'>
) {
  return useMutation<void, ApiError, { reviewId: string; isHelpful: boolean }>({
    mutationFn: ({ reviewId, isHelpful }) => toggleHelpful(placeId, reviewId, isHelpful),
    ...options,
  });
} 