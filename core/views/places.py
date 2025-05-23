from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django_filters import rest_framework as filters
from django.db.models import F, ExpressionWrapper, FloatField, Q, Avg, Prefetch, Count
from django.db.models.functions import Power, Sqrt, Radians, Sin, Cos, ACos
from django.core.cache import cache
from django.conf import settings
from django.db import connection
from django.db.models import Value
from django.contrib.postgres.indexes import GistIndex
from ..models import Place, Feature, Review
from ..choices import PLACE_TYPE_CHOICES, FEATURE_TYPES, DISTRICT_CHOICES
from ..serializers import PlaceSerializer
from ..permissions import IsOwnerOrReadOnly
import logging
import time
import math
from ..utils.geocoding import geocode_address, determine_district
from django.core.cache import cache
from django.http import Http404
from django_filters.rest_framework.filters import BaseInFilter, CharFilter
from django.core.exceptions import EmptyResultSet
from .filters import SafeCommaSeparatedListFilter # Assuming this is in the same directory or adjust path

# Set up logging with more detail for geolocation queries
logger = logging.getLogger(__name__)

# Constants for geolocation calculations
EARTH_RADIUS_KM = 6371.0  # Earth's radius in kilometers

class PlacePagination(PageNumberPagination):
    """
    Custom pagination class for places.
    
    Supports:
    - Page size control via 'page_size' query parameter (max 100)
    - Page number via 'page' parameter
    - Configurable defaults
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    page_query_param = 'page'

    def paginate_queryset(self, queryset, request, view=None):
        print(f"[PAGINATOR DEBUG] paginate_queryset called. Queryset count: {queryset.count()}")
        # Check if queryset is being properly materialized
        place_list = list(queryset[:5])  # Get first 5 places to debug
        print(f"[PAGINATOR DEBUG] First few places: {[p.name for p in place_list]}")
        
        page_number = request.query_params.get(self.page_query_param, 1)
        print(f"[PAGINATOR DEBUG] Requested page: {page_number}")
        
        result = super().paginate_queryset(queryset, request, view)
        if result is not None:
            print(f"[PAGINATOR DEBUG] Paginated result count: {len(result)}")
        else:
            print(f"[PAGINATOR DEBUG] Paginated result is None")
        return result

    def get_paginated_response(self, data):
        print(f"[PAGINATOR DEBUG] get_paginated_response called. Data count: {len(data)}")
        return super().get_paginated_response(data)

class PlaceFilter(filters.FilterSet):
    # Price level filters (Keep commented for now)
    # min_price = filters.NumberFilter(
    #     method='filter_by_price_level',
    #     help_text='Minimum price level value (1-4). API parameter: minPrice'
    # )
    # max_price = filters.NumberFilter(
    #     method='filter_by_price_level',
    #     help_text='Maximum price level value (1-4). API parameter: maxPrice'
    # )
    
    # Place type filters - use actual field name (Keep commented for now)
    # types = filters.MultipleChoiceFilter(
    #     field_name='place_type',
    #     choices=PLACE_TYPE_CHOICES,
    #     help_text='Filter by multiple place types (comma-separated)'
    # )
    
    # District filters - THIS IS THE ONE TO KEEP ACTIVE
    district = SafeCommaSeparatedListFilter(
        field_name='district',
        help_text='Filter by one or more districts (comma-separated, e.g. ?district=xinyi,daan)'
    )
    
    # Feature filters (Keep commented for now)
    # feature_name = filters.CharFilter(
    #     field_name='features__name',
    #     lookup_expr='icontains',
    #     help_text='Filter by feature name (case-insensitive)'
    # )
    # feature_type = filters.ChoiceFilter(
    #     field_name='features__type',
    #     choices=FEATURE_TYPES, # Ensure FEATURE_TYPES is defined or imported
    #     help_text='Filter by feature type'
    # )
    # has_features = filters.ModelMultipleChoiceFilter(
    #     queryset=Feature.objects.all(),
    #     method='filter_has_features',
    #     help_text='Filter places that have ALL specified features'
    # )
    # any_features = filters.ModelMultipleChoiceFilter(
    #     queryset=Feature.objects.all(),
    #     method='filter_any_features',
    #     help_text='Filter places that have ANY of the specified features'
    # )
    
    # Rating filters (Keep commented for now)
    # min_rating = filters.NumberFilter(
    #     method='filter_by_rating',
    #     help_text='Minimum average rating (1-5)'
    # )
    # max_rating = filters.NumberFilter(
    #     method='filter_by_rating',
    #     help_text='Maximum average rating (1-5)'
    # )
    
    # Geolocation filters (Keep commented for now)
    # latitude = filters.NumberFilter(
    #     method='filter_by_distance',
    #     help_text='Latitude for distance calculation'
    # )
    # longitude = filters.NumberFilter(
    #     method='filter_by_distance',
    #     help_text='Longitude for distance calculation'
    # )
    # radius = filters.NumberFilter(
    #     method='filter_by_distance',
    #     help_text='Search radius in kilometers'
    # )
    
    # Date filters (Keep commented for now)
    # created_after = filters.DateTimeFilter(
    #     field_name='created_at',
    #     lookup_expr='gte',
    #     help_text='Filter places created after this date'
    # )
    # created_before = filters.DateTimeFilter(
    #     field_name='created_at',
    #     lookup_expr='lte',
    #     help_text='Filter places created before this date'
    # )

    class Meta:
        model = Place
        fields = [] # Only 'district' is active and explicitly defined

    # Custom filter methods (Keep commented for now)
    # def filter_by_price_level(self, queryset, name, value):
    #     # ... existing implementation ...
    #     return queryset # Placeholder

    # def filter_by_rating(self, queryset, name, value):
    #     # ... existing implementation ...
    #     return queryset # Placeholder

    # def filter_by_distance(self, queryset, name, value):
    #     # ... existing implementation ...
    #     return queryset # Placeholder

    # def filter_has_features(self, queryset, name, value):
    #     # ... existing implementation ...
    #     return queryset.distinct() # Placeholder

    # def filter_any_features(self, queryset, name, value):
    #     # ... existing implementation ...
    #     return queryset.distinct() # Placeholder

class PlaceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing places.
    
    API Naming Convention:
        - All API field names use camelCase (e.g., priceLevel, placeType, isPrimary)
        - All database/model fields use snake_case (e.g., price_level, place_type, is_primary)
        - Filter parameters use the API camelCase convention (e.g., minPrice, maxPrice)
    
    list:
        Return a paginated list of all places with search, filtering, and sorting capabilities.
        
        For anonymous users, only approved places are shown.
        For authenticated users, their draft and pending places are also included.
        For moderators, all places are visible with moderation status.
        
        Pagination:
        - Use ?page=N to get page number N
        - Use ?page_size=N to set results per page (max 100)
        - Default page size: 20 items
        - Response includes next/previous page links
        
        Search:
        - Text search across place names, descriptions, addresses, and feature names
        - Use ?search=query parameter for text search
        
        Sorting:
        - Use ?ordering=field for sorting
        - Available fields: name, created_at, price_level, place_type, rating, distance
        - Prefix with '-' for descending order (e.g. ?ordering=-rating)
        - Default: -created_at (newest first)
        - Distance sorting available when using geolocation filters
        
        Filtering:
        - minPrice/maxPrice: Filter by price level (1-4) [maps to price_level model field]
        - placeType: Filter by place type [maps to place_type model field]
        - featureName: Filter by feature name [maps to features__name model field]
        - featureType: Filter by feature type [maps to features__type model field]
        - hasFeatures: Filter places with ALL specified features
        - anyFeatures: Filter places with ANY specified features
        - createdAfter/createdBefore: Filter by creation date
        - minRating/maxRating: Filter by average rating (1-5)
        
        Geolocation:
        - latitude/longitude: Center point coordinates
        - radius: Search radius in kilometers (default: 5km)
        - Results include distance from search point
        - Can sort by distance using ?ordering=distance
        - Uses spatial indexing and caching for performance
        - Accurate Haversine formula for distance calculation
        
    create:
        Create a new place. Must be authenticated.
        
    retrieve:
        Return the given place. Draft places are only visible to their owners.
        
    update:
        Update a place. Must be the owner of the place.
        
    partial_update:
        Update a place partially. Must be the owner of the place.
        
    destroy:
        Delete a place. Must be the owner of the place.
        
    publish:
        Change a place from draft to published state. Must be the owner of the place.

    geocode:
        Geocode the place's address to get latitude, longitude, and district.
        
        This is useful when address is updated or for places created without coordinates.
    """
    queryset = Place.objects.all().select_related('created_by').prefetch_related('features')
    serializer_class = PlaceSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

    filterset_class = PlaceFilter

    search_fields = ['name', 'description', 'address', 'features__name']
    ordering_fields = ['name', 'created_at', 'price_level', 'place_type', 'rating', 'distance']
    ordering = ['-created_at']  # Default ordering
    pagination_class = PlacePagination

    def get_permissions(self):
        """
        Instantiate and return the list of permissions that this view requires.
        """
        if self.action == 'batch_geocode':
            permission_classes = [permissions.IsAdminUser]
        elif self.action == 'geocode':
            permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
        elif self.action in ['list', 'retrieve']:
            permission_classes = []
        elif self.action == 'districts':
            permission_classes = []  # Make districts public
        else:
            permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Return appropriate queryset based on user role:
        - Anonymous users: approved places only
        - Regular users: their own + approved places
        - Staff/admins: all places
        
        The appropriate filters for moderation status are applied,
        along with any other filters specified in the request.
        """
        user = self.request.user
        action = self.action
        print(f"[DEBUG PV.get_queryset] Action: {action}, User: {user} (is_authenticated={user.is_authenticated})")
        
        # Base queryset with related fields loaded
        base_queryset = Place.objects.all().select_related('created_by')
        
        # Add annotations or ordering as needed
        queryset_to_return = base_queryset

        # Filter by publication and moderation status as appropriate
        if not user.is_authenticated:
            # Anonymous users see only published and approved places
            print(f"[DEBUG PV.get_queryset] Anonymous user, filtering for APPROVED, non-draft places")
            print(f"[DEBUG PV.get_queryset] Before filter, count: {queryset_to_return.count()}")
            
            # Use Q objects to build the filter
            queryset_to_return = queryset_to_return.filter(
                Q(draft=False) & Q(moderation_status__exact='APPROVED')
            )
            
            print(f"[DEBUG PV.get_queryset] After filter, count: {queryset_to_return.count()}")
            
            # Print the SQL query for debugging
            try:
                print(f"[DEBUG PV.get_queryset] SQL: {queryset_to_return.query}")
            except Exception as e:
                print(f"[DEBUG PV.get_queryset] Error getting SQL query: {str(e)}")
            
            # List the actual places to verify the data
            first_places = list(queryset_to_return[:5])
            print(f"[DEBUG PV.get_queryset] First places: {[p.name for p in first_places]}")
            
            if queryset_to_return.count() == 0:
                # Check if there are any places that should match
                all_approved = Place.objects.filter(
                    Q(draft=False) & Q(moderation_status__exact='APPROVED')
                ).count()
                print(f"[DEBUG PV.get_queryset] Total approved places in DB: {all_approved}")
                
        elif user.is_staff or user.is_superuser:
            pass # Staff/superuser see all
        else: # Authenticated non-staff user
            # Regular users see their own places (any status) + approved places from others
            print(f"[DEBUG PV.get_queryset] Authenticated user: {user}, filtering for own places + APPROVED places")
            print(f"[DEBUG PV.get_queryset] Before filter, count: {queryset_to_return.count()}")
            
            # Use Q objects and wrap string literals in quotes
            
            queryset_to_return = queryset_to_return.filter(
                Q(created_by=user) | (Q(moderation_status__exact='APPROVED') & Q(draft=False))
            )
            
            print(f"[DEBUG PV.get_queryset] After filter, count: {queryset_to_return.count()}")
            
            # Print the SQL query for debugging
            try:
                print(f"[DEBUG PV.get_queryset] SQL: {queryset_to_return.query}")
            except Exception as e:
                print(f"[DEBUG PV.get_queryset] Error getting SQL query: {str(e)}")
            
            # List the actual places to verify the data
            first_places = list(queryset_to_return[:5])
            print(f"[DEBUG PV.get_queryset] First places: {[p.name for p in first_places]}")
            
            if queryset_to_return.count() == 0:
                # Check if there are any places that should match
                user_places = Place.objects.filter(created_by=user).count()
                approved_places = Place.objects.filter(
                    Q(draft=False) & Q(moderation_status__exact='APPROVED')
                ).count()
                print(f"[DEBUG PV.get_queryset] Total user places in DB: {user_places}")
                print(f"[DEBUG PV.get_queryset] Total approved places in DB: {approved_places}")

        # The self.filter_queryset call will be made by the mixins (e.g., ListModelMixin)
        # We should NOT call it here if get_queryset is to be reusable by actions like 'publish'
        # that might not want default filtering.
        # However, for list/detail views, DRF applies it. If action == 'publish', it's not called by DRF's default publish action.

        # Decision: For typical list/retrieve actions, DRF applies filtering. 
        # For our custom 'publish' action, we might apply filters differently or not at all.
        # The current problem is that when DRF applies PlaceFilter, it breaks.
        # So, removing the conditional logic here means PlaceFilter is *always* problematic when applied by DRF.
        
        try:
            print(f"[DEBUG PV.get_queryset] For action '{action}', final SQL before return: {queryset_to_return.query}")
        except Exception as e:
            print(f"[DEBUG PV.get_queryset] Error getting final SQL query: {str(e)}")
            
        try:
            print(f"[DEBUG PV.get_queryset] Final queryset count: {queryset_to_return.count()}")
        except EmptyResultSet:
            return base_queryset.none()
        except Exception as e:
            print(f"[DEBUG PV.get_queryset] Error getting final count: {str(e)}")
            # Return an empty queryset when we get an EmptyResultSet or other exception during count
            return base_queryset.none()
                
        return queryset_to_return

    def perform_create(self, serializer):
        """Set the user to the current user when creating a place"""
        serializer.save(created_by=self.request.user)


    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsOwnerOrReadOnly])
    def publish(self, request, pk=None):
        print(f"[DEBUG PV.publish] Method entered for place id={pk}, User: {request.user.username}")

        place_instance = self.get_object() # <--- REVERT TO THIS
        print(f"[DEBUG PV.publish] self.get_object() returned: {place_instance.name if place_instance else 'None'}, Draft: {place_instance.draft if place_instance else 'N/A'}")

        if not place_instance.draft:
            print(f"[DEBUG PV.publish] Place pk={pk} is already published (not draft).")
            return Response(
                {'detail': 'This place is already published.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        place_instance.draft = False
        place_instance.moderation_status = 'PENDING' # It becomes pending after publishing
        place_instance.save(update_fields=['draft', 'moderation_status'])
        print(f"[DEBUG PV.publish] Place pk={pk} successfully published. Draft: {place_instance.draft}, Status: {place_instance.moderation_status}")

        if hasattr(cache, 'delete_pattern'):
            try:
                cache.delete_pattern("places_list:*")
                print(f"[DEBUG PV.publish] Cache pattern 'places_list:*' deleted.")
            except Exception as e:
                print(f"[DEBUG PV.publish] Error calling cache.delete_pattern: {e}")
        else:
            print(f"[DEBUG PV.publish] Cache backend ({type(cache).__name__}) does not support 'delete_pattern'.")

        serializer = self.get_serializer(place_instance) # Use the instance from get_object()
        return Response(serializer.data)


    @action(detail=False, methods=['get'])
    def near_me(self, request):
        """
        Find places near the user's location with optimized distance calculation.
        
        Query parameters:
        - lat: Latitude
        - lng: Longitude
        - radius: Search radius in kilometers (default: 5)
        - limit: Maximum number of results (default: 20)
        - type: Filter by place type
        - features: Comma-separated list of feature IDs to filter by
        
        Returns places sorted by distance (closest first).
        """
        # Get parameters
        try:
            lat = float(request.query_params.get('lat', 0))
            lng = float(request.query_params.get('lng', 0))
        except (ValueError, TypeError):
            return Response(
                {"detail": "Invalid coordinates. Please provide valid lat and lng parameters."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if lat == 0 and lng == 0:
            return Response(
                {"detail": "Coordinates are required. Please provide lat and lng parameters."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        radius = float(request.query_params.get('radius', 5))
        limit = int(request.query_params.get('limit', 20))
        
        # Use the model's near method
        nearby_places = Place.near(lat, lng, radius_km=radius)
        
        # Apply additional filters
        place_type = request.query_params.get('type')
        if place_type:
            nearby_places = nearby_places.filter(place_type=place_type)
        
        features = request.query_params.get('features')
        if features:
            feature_ids = features.split(',')
            nearby_places = nearby_places.filter(features__id__in=feature_ids).distinct()
        
        # Filter by moderation status for non-staff users
        if not request.user.is_staff:
            nearby_places = nearby_places.filter(
                Q(moderation_status='APPROVED') |
                (Q(created_by=request.user) & ~Q(moderation_status='REJECTED'))
            )
        
        # Calculate distance using the Haversine formula
        lat_rad = math.radians(lat)
        lng_rad = math.radians(lng)
        
        # Annotate with distance and order by distance
        nearby_places = nearby_places.annotate(
            distance=ExpressionWrapper(
                EARTH_RADIUS_KM * ACos(
                    Cos(Value(lat_rad)) * Cos(Radians('latitude')) *
                    Cos(Radians('longitude') - Value(lng_rad)) +
                    Sin(Value(lat_rad)) * Sin(Radians('latitude'))
                ),
                output_field=FloatField()
            )
        ).order_by('distance')[:limit]
        
        # Serialize and return the results
        serializer = self.get_serializer(nearby_places, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[])
    def districts(self, request):
        """
        Get a list of all districts with place counts.
        
        Returns:
        - List of districts with their display names, values, and the count of approved places
        - Sorted by district name
        - Example: [{"name": "Da'an", "value": "daan", "count": 15}, ...]
        """
        # Start with all approved places for counting
        base_queryset = Place.objects.filter(moderation_status='APPROVED')
        
        # Get counts for each district
        district_counts = {}
        for district_value, district_name in DISTRICT_CHOICES:
            count = base_queryset.filter(district=district_value).count()
            district_counts[district_value] = {
                'name': district_name,
                'value': district_value,
                'count': count
            }
        
        # Convert to sorted list
        result = list(district_counts.values())
        result.sort(key=lambda x: x['name'])
        
        return Response(result, status=status.HTTP_200_OK) 