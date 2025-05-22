"""
Views for handling moderation of places, reviews, and photos.
Provides centralized moderation endpoints with proper status management.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone

from ..models import Place, Review, PlacePhoto, Notification
from ..serializers import (
    PlaceSerializer, ReviewSerializer, PhotoSerializer,
    ModerationStatusSerializer
)
from ..permissions import IsModeratorPermission

class BaseModerationViewSet(viewsets.ReadOnlyModelViewSet):
    """Base viewset for moderation views."""
    permission_classes = [IsAuthenticated, IsModeratorPermission]
    serializer_class = None
    queryset = None
    
    def get_queryset(self):
        """
        Filter queryset based on moderation status for the 'list' action (moderation queue).
        For detail actions, return a less filtered queryset so get_object can find items
        regardless of their current moderation status (which might be about to change).
        """
        queryset = self.queryset # e.g., Place.objects.all()

        if self.action == 'list': # Only apply queue filters for the list view
            status_param = self.request.query_params.get('status', 'PENDING')
            if status_param:
                queryset = queryset.filter(moderation_status=status_param)

            # Assuming 'draft' is relevant for all moderated models when in PENDING queue
            if status_param == 'PENDING' and hasattr(self.queryset.model, 'draft'):
                queryset = queryset.filter(draft=False)

        # For detail actions (retrieve, update_status), get_object will filter this by PK.
        # No further status filtering here ensures get_object can find e.g. an APPROVED item to update.
        return queryset.select_related('moderator') 
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update moderation status of an object."""
        obj = self.get_object()
        serializer = ModerationStatusSerializer(data=request.data)
        
        if serializer.is_valid():
            new_status = serializer.validated_data['status']
            comment = serializer.validated_data.get('comment', '')
            
            # Update object
            obj.moderation_status = new_status
            obj.moderation_comment = comment
            obj.moderated_at = timezone.now()
            obj.moderator = request.user
            obj.save()
            
            # Create notification
            notification_type = f"{obj._meta.model_name}_{new_status}"
            Notification.create_content_notification(obj, notification_type)
            
            return Response({
                'status': 'success',
                'message': f'{obj._meta.verbose_name.title()} has been {new_status}'
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PlaceModerationViewSet(BaseModerationViewSet):
    """ViewSet for moderating places."""
    serializer_class = PlaceSerializer
    queryset = Place.objects.all()

class ReviewModerationViewSet(BaseModerationViewSet):
    """ViewSet for moderating reviews."""
    serializer_class = ReviewSerializer
    queryset = Review.objects.all()

class PhotoModerationViewSet(BaseModerationViewSet):
    """ViewSet for moderating photos."""
    serializer_class = PhotoSerializer
    queryset = PlacePhoto.objects.all() 