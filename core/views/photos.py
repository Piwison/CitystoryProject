"""
Views for managing place photos.
Includes endpoints for uploading, listing, retrieving, and deleting photos.
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Max
from core.models import Photo, Place, Notification
from core.serializers import PhotoSerializer
from core.permissions import IsOwnerOrReadOnly
from django.db.models import Q
from rest_framework.parsers import MultiPartParser, FormParser

class PhotoViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing photos.
    
    Provides CRUD operations for photos with proper permission handling
    and automatic user/place assignment.
    """
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    serializer_class = PhotoSerializer
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        """
        Get photos for a specific place, filtered by moderation status and permissions.
        
        - Anonymous users: See only approved photos
        - Authenticated users: See their own photos (any status) + approved photos
        - Staff/admin: See all photos
        """
        place = get_object_or_404(Place, pk=self.kwargs['place_pk'])
        user = self.request.user
        
        # Start with base queryset
        queryset = Photo.objects.filter(place=place).select_related('uploader')
        
        # Filter by permission level and moderation status
        if not user.is_authenticated:
            # Anonymous users can only see approved photos
            queryset = queryset.filter(moderation_status='approved')
        elif user.is_staff or user.is_superuser:
            # Staff can see all photos
            pass
        else:
            # Regular authenticated users can see their own photos + approved photos
            queryset = queryset.filter(
                Q(uploader=user) |  # Their own photos (any status)
                Q(moderation_status='approved')  # Approved photos from others
            )
            
        return queryset
    
    def perform_create(self, serializer):
        """Create a new photo, associating it with the current user and place"""
        place = get_object_or_404(Place, pk=self.kwargs['place_pk'])
        serializer.save(uploader=self.request.user, place=place)
    
    def perform_update(self, serializer):
        """Update an existing photo"""
        serializer.save()
    
    def perform_destroy(self, instance):
        """Delete the photo and its files."""
        # Delete the actual files
        if instance.image:
            instance.image.delete(save=False)
        if instance.thumbnail:
            instance.thumbnail.delete(save=False)
        instance.delete()
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def moderate(self, request, place_pk=None, pk=None):
        """
        Toggle the moderation status of a photo.
        Only staff users can moderate photos.
        """
        photo = self.get_object()
        photo.is_approved = not photo.is_approved
        photo.save()
        
        serializer = self.get_serializer(photo)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_uploads(self, request, place_pk=None):
        """
        Return all photos uploaded by the current user for this place.
        Must be authenticated.
        """
        if not request.user.is_authenticated:
            return Response(
                {'detail': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        photos = self.get_queryset().filter(uploader=request.user)
        serializer = self.get_serializer(photos, many=True)
        return Response(serializer.data) 