from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models, transaction
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, CharFilter, DateFromToRangeFilter
from django.utils.translation import gettext_lazy as _

from ..models import SavedPlace, Place
from ..serializers import SavedPlaceSerializer
from ..permissions import IsOwnerOrReadOnly


class SavedPlaceFilter(FilterSet):
    """Filter set for saved places."""
    search = CharFilter(method='filter_search', label=_('Search'))
    created_at = DateFromToRangeFilter()
    district = CharFilter(field_name='place__district')
    place_type = CharFilter(field_name='place__place_type')
    
    class Meta:
        model = SavedPlace
        fields = ['search', 'created_at', 'district', 'place_type']
    
    def filter_search(self, queryset, name, value):
        """Search in place name, notes, and address."""
        if value:
            return queryset.filter(
                Q(place__name__icontains=value) |
                Q(notes__icontains=value) |
                Q(place__address__icontains=value)
            )
        return queryset


class SavedPlaceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing saved places."""
    serializer_class = SavedPlaceSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = SavedPlaceFilter
    ordering_fields = ['created_at', 'updated_at', 'place__name']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Return saved places for the current user."""
        return SavedPlace.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Set the user when creating a saved place."""
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def toggle(self, request):
        """Toggle a place as saved/unsaved."""
        place_id = request.data.get('place_id')
        notes = request.data.get('notes', '')
        
        if not place_id:
            return Response(
                {'error': 'place_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            place = Place.objects.get(id=place_id)
        except Place.DoesNotExist:
            return Response(
                {'error': 'Place not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        saved_place = SavedPlace.objects.filter(
            user=request.user, 
            place=place
        ).first()
        
        if saved_place:
            saved_place.delete()
            return Response({'status': 'removed'})
        else:
            saved_place = SavedPlace.objects.create(
                user=request.user,
                place=place,
                notes=notes
            )
            serializer = self.get_serializer(saved_place)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def is_saved(self, request):
        """Check if a place is saved by the current user."""
        place_id = request.query_params.get('place_id')
        
        if not place_id:
            return Response(
                {'error': 'place_id query parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        is_saved = SavedPlace.objects.filter(
            user=request.user, 
            place_id=place_id
        ).exists()
        
        return Response({'is_saved': is_saved})
    
    @action(detail=False, methods=['post'])
    def batch_save(self, request):
        """Batch save multiple places."""
        place_ids = request.data.get('place_ids', [])
        
        if not place_ids or not isinstance(place_ids, list):
            return Response(
                {'error': 'place_ids must be a non-empty list'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate all places exist
        existing_places = Place.objects.filter(id__in=place_ids).values_list('id', flat=True)
        if len(existing_places) != len(place_ids):
            missing = set(place_ids) - set(existing_places)
            return Response(
                {'error': f'Some places not found: {missing}'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create saved places in bulk
        created_count = 0
        with transaction.atomic():
            for place_id in place_ids:
                _, created = SavedPlace.objects.get_or_create(
                    user=request.user,
                    place_id=place_id
                )
                if created:
                    created_count += 1
        
        return Response({
            'status': 'success',
            'message': f'Added {created_count} places to your saved places'
        })
    
    @action(detail=False, methods=['post'])
    def batch_unsave(self, request):
        """Batch remove multiple saved places."""
        place_ids = request.data.get('place_ids', [])
        
        if not place_ids or not isinstance(place_ids, list):
            return Response(
                {'error': 'place_ids must be a non-empty list'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delete all matching saved places
        deleted_count, _ = SavedPlace.objects.filter(
            user=request.user,
            place_id__in=place_ids
        ).delete()
        
        return Response({
            'status': 'success',
            'message': f'Removed {deleted_count} places from your saved places'
        })
    
    @action(detail=False, methods=['post'])
    def batch_update_notes(self, request):
        """Batch update notes for multiple saved places."""
        updates = request.data.get('updates', [])
        
        if not updates or not isinstance(updates, list):
            return Response(
                {'error': 'updates must be a non-empty list of {place_id, notes} objects'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        updated_count = 0
        errors = []
        
        with transaction.atomic():
            for update in updates:
                place_id = update.get('place_id')
                notes = update.get('notes', '')
                
                if not place_id:
                    errors.append({'place_id': 'Missing place_id in update'})
                    continue
                
                try:
                    saved_place = SavedPlace.objects.get(
                        user=request.user,
                        place_id=place_id
                    )
                    saved_place.notes = notes
                    saved_place.save(update_fields=['notes', 'updated_at'])
                    updated_count += 1
                except SavedPlace.DoesNotExist:
                    errors.append({
                        'place_id': place_id,
                        'error': 'Place not found in your saved places'
                    })
        
        response_data = {
            'status': 'success',
            'updated_count': updated_count
        }
        
        if errors:
            response_data['errors'] = errors
            
        return Response(response_data) 