from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework.permissions import IsAuthenticated
from django.contrib.contenttypes.models import ContentType

from ..models import Review, Place, Notification
from ..serializers import ReviewSerializer
from ..filters import ReviewFilter
from ..permissions import IsOwnerOrReadOnly, IsModeratorOrReadOnly
from ..models.helpful_vote import HelpfulVote

class PlaceTypeReviewValidator:
    """
    Middleware for validating reviews based on place type.
    Different place types require different rating fields.
    """
    def validate_review_data(self, place, data):
        errors = {}
        
        # All places require overall_rating
        if 'overall_rating' not in data or data['overall_rating'] is None:
            errors['overall_rating'] = ['Overall rating is required for all places.']
            
        # Food establishments require food and service ratings
        if place.type in ['restaurant', 'cafe', 'bar']:
            if 'food_rating' not in data or data['food_rating'] is None:
                errors['food_rating'] = ['Food quality rating is required for restaurants, cafes, and bars.']
                
            if 'service_rating' not in data or data['service_rating'] is None:
                errors['service_rating'] = ['Service rating is required for restaurants, cafes, and bars.']
        
        # Hotels require cleanliness rating
        if place.type == 'hotel':
            if 'cleanliness_rating' not in data or data['cleanliness_rating'] is None:
                errors['cleanliness_rating'] = ['Cleanliness rating is required for hotels.']
                
        # Return errors dictionary if any errors found, otherwise None
        return errors if errors else None

class ReviewViewSet(viewsets.ModelViewSet, PlaceTypeReviewValidator):
    """
    ViewSet for managing reviews.
    
    Provides CRUD operations for reviews with proper permission handling
    and automatic user/place assignment.
    """
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    serializer_class = ReviewSerializer
    filterset_class = ReviewFilter
    
    def get_queryset(self):
        """
        Get reviews for a specific place, filtered by moderation status and permissions.
        
        - Anonymous users: See only approved reviews
        - Authenticated users: See their own reviews (any status) + approved reviews
        - Staff/admin: See all reviews
        """
        place = get_object_or_404(Place, pk=self.kwargs['place_pk'])
        user = self.request.user
        
        # Start with base queryset
        queryset = Review.objects.filter(place=place).select_related('user')
        
        # Filter by permission level and moderation status
        if not user.is_authenticated:
            # Anonymous users can only see approved reviews
            queryset = queryset.filter(moderation_status='APPROVED')
        elif user.is_staff or user.is_superuser:
            # Staff can see all reviews
            pass
        else:
            # Regular authenticated users can see their own reviews + approved reviews
            queryset = queryset.filter(
                Q(user=user) |  # Their own reviews (any status)
                Q(moderation_status='APPROVED')  # Approved reviews from others
            )
            
        return queryset
    
    def create(self, request, *args, **kwargs):
        """
        Create a review with validation based on place type.
        """
        place = get_object_or_404(Place, pk=self.kwargs['place_pk'])
        
        # Validate according to place type
        errors = self.validate_review_data(place, request.data)
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """
        Update a review with validation based on place type.
        """
        instance = self.get_object()
        place = instance.place
        
        # Validate according to place type
        errors = self.validate_review_data(place, request.data)
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
            
        return super().update(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        """Create a new review, associating it with the current user and place"""
        place = get_object_or_404(Place, pk=self.kwargs['place_pk'])
        serializer.save(user=self.request.user, place=place)
    
    def perform_update(self, serializer):
        """Update an existing review"""
        serializer.save()
    
    def perform_destroy(self, instance):
        """Delete the review and recalculate place ratings."""
        place = instance.place
        instance.delete()
        # Recalculate place ratings after review deletion
        if place:
            place.update_average_ratings()
    
    @action(detail=True, methods=['POST'], permission_classes=[IsAuthenticated])
    def helpful(self, request, pk=None, place_pk=None):
        """Toggle marking a review as helpful."""
        review = self.get_object()
        user = request.user
        
        # Prevent users from marking their own reviews as helpful
        if review.user == user:
            return Response(
                {'detail': 'You cannot mark your own review as helpful.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Toggle the helpful vote
        vote_added, helpful_count = HelpfulVote.toggle_vote(review, user)
        
        # Notify the review author if a vote was added
        if vote_added:
            Notification.objects.create(
                user=review.user,
                notification_type='review_helpful',
                title='Someone found your review helpful!',
                message=f'Your review of {review.place.name} was marked as helpful.',
                content_type=ContentType.objects.get_for_model(review),
                object_id=review.id
            )
        
        return Response({
            'status': 'success',
            'action': 'added' if vote_added else 'removed',
            'helpful_count': helpful_count
        })
    
    @action(detail=True, methods=['POST'], permission_classes=[IsModeratorOrReadOnly])
    def toggle_moderation(self, request, pk=None, place_pk=None):
        """Toggle the moderation status of a review."""
        review = self.get_object()
        review.is_moderated = not review.is_moderated
        review.save()
        
        serializer = self.get_serializer(review)
        return Response(serializer.data)
    
    @action(detail=False, methods=['GET'], permission_classes=[permissions.IsAuthenticated])
    def my_reviews(self, request, place_pk=None):
        """Get all reviews by the current user for the specified place."""
        reviews = self.get_queryset().filter(user=request.user)
        page = self.paginate_queryset(reviews)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)