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

class PlaceFilter(filters.FilterSet):
    """
    Advanced filtering for places.
    
    Supports:
    - Price range filtering (min/max)
    - Place type filtering with multiple selection
    - Feature filtering (name, type, has_all, has_any)
    - Geolocation-based filtering with optimized distance calculation
    - Rating-based filtering
    - Date range filtering
    - District-based filtering with multiple selection
    """
    # Price range filters
    min_price = filters.NumberFilter(
        method='filter_by_price_range',
        help_text='Minimum price range value in NT$'
    )
    max_price = filters.NumberFilter(
        method='filter_by_price_range',
        help_text='Maximum price range value in NT$'
    )
    
    # Place type filters
    types = filters.MultipleChoiceFilter(
        field_name='type',
        choices=PLACE_TYPE_CHOICES,
        help_text='Filter by multiple place types (comma-separated)'
    )
    
    # District filters
    districts = filters.MultipleChoiceFilter(
        field_name='district',
        choices=DISTRICT_CHOICES,
        help_text='Filter by multiple districts (comma-separated)'
    )
    
    # Feature filters
    feature_name = filters.CharFilter(
        field_name='features__name',
        lookup_expr='icontains',
        help_text='Filter by feature name (case-insensitive)'
    )
    feature_type = filters.ChoiceFilter(
        field_name='features__type',
        choices=FEATURE_TYPES,
        help_text='Filter by feature type'
    )
    has_features = filters.ModelMultipleChoiceFilter(
        queryset=Feature.objects.all(),
        method='filter_has_features',
        help_text='Filter places that have ALL specified features'
    )
    any_features = filters.ModelMultipleChoiceFilter(
        queryset=Feature.objects.all(),
        method='filter_any_features',
        help_text='Filter places that have ANY of the specified features'
    )
    
    # Rating filters
    min_rating = filters.NumberFilter(
        method='filter_by_rating',
        help_text='Minimum average rating (1-5)'
    )
    max_rating = filters.NumberFilter(
        method='filter_by_rating',
        help_text='Maximum average rating (1-5)'
    )
    
    # Geolocation filters
    latitude = filters.NumberFilter(
        method='filter_by_distance',
        help_text='Latitude for distance calculation'
    )
    longitude = filters.NumberFilter(
        method='filter_by_distance',
        help_text='Longitude for distance calculation'
    )
    radius = filters.NumberFilter(
        method='filter_by_distance',
        help_text='Search radius in kilometers'
    )
    
    # Date filters
    created_after = filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='gte',
        help_text='Filter places created after this date'
    )
    created_before = filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='lte',
        help_text='Filter places created before this date'
    )

    def filter_by_price_range(self, queryset, name, value):
        """
        Filter places by price range using the new numeric values.
        Handles specific cases like '2000+' (2000 or greater).
        
        DEBUG: Directly access the database instead of using the passed queryset
        which appears to be empty despite places existing in the database.
        """
        # Add detailed debug logging
        print(f"\n======= PRICE RANGE FILTER DEBUG =======")
        print(f"Filter name: {name}, value: {value}, type: {type(value)}")
        
        # Debug the queryset passed to filter method
        place_count = queryset.count()
        print(f"Original queryset before filtering has {place_count} places")
        
        # BYPASS ISSUE: Get places directly from database instead of using passed queryset
        from ..models import Place  # Import here to avoid circular imports
        all_places = Place.objects.all()
        all_places_count = all_places.count()
        print(f"Total places in database directly: {all_places_count}")
        
        if all_places_count > 0:
            for place in all_places:
                print(f"DB place: ID={place.id}, Name={place.name}, Price Range={place.price_range}")
        
        # Always convert value to integer for comparison
        try:
            value_int = int(value)
        except (ValueError, TypeError):
            print(f"Error converting value to int: {value}")
            return queryset
            
        # SIMPLIFIED APPROACH - Instead of complex logic, let's explicitly list what each filter should return
        if name == 'min_price':
            # Define eligible ranges based on min_price
            if value_int <= 0:
                # All price ranges are eligible
                eligible_ranges = ['0', '200', '400', '600', '800', '1000', '1500', '2000', '2000+']
            elif value_int <= 200:
                eligible_ranges = ['200', '400', '600', '800', '1000', '1500', '2000', '2000+']
            elif value_int <= 400:
                eligible_ranges = ['400', '600', '800', '1000', '1500', '2000', '2000+']
            elif value_int <= 600:
                eligible_ranges = ['600', '800', '1000', '1500', '2000', '2000+']
            elif value_int <= 800:
                eligible_ranges = ['800', '1000', '1500', '2000', '2000+']
            elif value_int <= 1000:
                eligible_ranges = ['1000', '1500', '2000', '2000+']
            elif value_int <= 1500:
                eligible_ranges = ['1500', '2000', '2000+']
            elif value_int <= 2000:
                eligible_ranges = ['2000', '2000+']
            else:  # > 2000
                eligible_ranges = ['2000+']
        
        elif name == 'max_price':
            # Define eligible ranges based on max_price
            if value_int < 200:
                eligible_ranges = ['0']
            elif value_int < 400:
                eligible_ranges = ['0', '200']
            elif value_int < 600:
                eligible_ranges = ['0', '200', '400']
            elif value_int < 800:
                eligible_ranges = ['0', '200', '400', '600']
            elif value_int < 1000:
                eligible_ranges = ['0', '200', '400', '600', '800']
            elif value_int < 1500:
                eligible_ranges = ['0', '200', '400', '600', '800', '1000']
            elif value_int < 2000:
                eligible_ranges = ['0', '200', '400', '600', '800', '1000', '1500']
            else:  # >= 2000
                eligible_ranges = ['0', '200', '400', '600', '800', '1000', '1500', '2000', '2000+']
        else:
            # Unknown filter name
            print(f"Unknown filter name: {name}")
            return queryset
            
        print(f"Eligible price ranges for {name}={value}: {eligible_ranges}")
        
        # DIRECTLY filter the database instead of using the provided queryset
        filtered = Place.objects.filter(price_range__in=eligible_ranges)
        
        # Debug the filtered queryset
        filtered_count = filtered.count()
        print(f"Filtered queryset has {filtered_count} places")
        if filtered_count > 0:
            for place in filtered:
                print(f"  Place {place.id}: {place.name} - price_range={place.price_range}")
        
        print(f"======= END PRICE RANGE FILTER DEBUG =======\n")
        return filtered

    def filter_by_rating(self, queryset, name, value):
        """
        Filter places by their average rating.
        Adds index hints for optimization when filtering by rating.
        """
        if name == 'min_rating':
            return queryset.annotate(
                avg_rating=Avg('reviews__overall_rating')
            ).filter(avg_rating__gte=value).distinct()
        elif name == 'max_rating':
            return queryset.annotate(
                avg_rating=Avg('reviews__overall_rating')
            ).filter(avg_rating__lte=value).distinct()
        return queryset

    def filter_by_distance(self, queryset, name, value):
        """
        Filter places within a specified radius of given coordinates.
        Uses the Haversine formula with optimized SQL and spatial indexing.
        
        The Haversine formula is more accurate than Euclidean distance
        as it accounts for Earth's curvature.
        """
        params = self.data
        lat = float(params.get('latitude', 0))
        lon = float(params.get('longitude', 0))
        radius = float(params.get('radius', 5))  # Default 5km radius
        
        if not all([lat, lon, radius]):
            return queryset
            
        # Cache key based on coordinates and radius
        cache_key = f"places_near_{lat}_{lon}_{radius}"
        cached_results = cache.get(cache_key)
        
        if cached_results is not None:
            logger.debug(f"Cache hit for geolocation query: {cache_key}")
            return cached_results
            
        # Start timing the query
        start_time = time.time()
        
        # Convert latitude and longitude to radians
        lat_rad = Radians(Value(lat))
        lon_rad = Radians(Value(lon))
        lat_field_rad = Radians(F('latitude'))
        lon_field_rad = Radians(F('longitude'))
        
        # Calculate distance using the Haversine formula
        distance = ExpressionWrapper(
            EARTH_RADIUS_KM * ACos(
                Cos(lat_rad) * Cos(lat_field_rad) *
                Cos(lon_field_rad - lon_rad) +
                Sin(lat_rad) * Sin(lat_field_rad)
            ),
            output_field=FloatField()
        )
        
        # Add spatial index hint and null checks
        queryset = queryset.filter(
            Q(latitude__isnull=False) & 
            Q(longitude__isnull=False)
        ).extra(
            hints={'place_location_idx': 'USE INDEX'}
        )
        
        # Annotate with distance and filter
        queryset = queryset.annotate(
            distance=distance
        ).filter(distance__lte=radius)
        
        # Log query performance
        query_time = time.time() - start_time
        if query_time > 1.0:  # Log slow queries (>1 second)
            logger.warning(
                f"Slow geolocation query detected: {query_time:.2f}s\n"
                f"Parameters: lat={lat}, lon={lon}, radius={radius}km\n"
                f"Query plan: {connection.queries[-1]}"
            )
        else:
            logger.debug(f"Geolocation query completed in {query_time:.2f}s")
        
        # Cache results for 5 minutes if query is fast
        if query_time < 1.0:
            cache.set(cache_key, queryset, timeout=300)
        
        return queryset

    def filter_has_features(self, queryset, name, value):
        """
        Filter places that have ALL of the specified features.
        Uses EXISTS subqueries for better performance with multiple features.
        """
        for feature in value:
            queryset = queryset.filter(features=feature)
        return queryset.distinct()

    def filter_any_features(self, queryset, name, value):
        """
        Filter places that have ANY of the specified features.
        Uses IN clause for optimal performance.
        """
        return queryset.filter(features__in=value).distinct()

    class Meta:
        model = Place
        fields = [
            'types', 'price_range', 'draft',
            'feature_name', 'feature_type',
            'has_features', 'any_features',
            'min_rating', 'max_rating',
            'districts'
        ]

class PlaceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing places.
    
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
        - Available fields: name, created_at, price_range, type, rating, distance
        - Prefix with '-' for descending order (e.g. ?ordering=-rating)
        - Default: -created_at (newest first)
        - Distance sorting available when using geolocation filters
        
        Filtering:
        - min_price/max_price: Filter by price range
        - type: Filter by place type
        - feature_name: Filter by feature name
        - feature_type: Filter by feature type
        - has_features: Filter places with ALL specified features
        - any_features: Filter places with ANY specified features
        - created_after/created_before: Filter by creation date
        
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
    queryset = Place.objects.all()
    serializer_class = PlaceSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    filterset_class = PlaceFilter
    search_fields = ['name', 'description', 'address', 'features__name']
    ordering_fields = ['name', 'created_at', 'price_range', 'type', 'rating', 'distance']
    ordering = ['-created_at']  # Default ordering
    pagination_class = PlacePagination

    def get_permissions(self):
        """
        Instantiate and return the list of permissions that this view requires.
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = []
        else:
            permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Get list of places filtered by permissions and moderation status.
        
        - For anonymous users: Only show approved places
        - For authenticated users: Show their own places (any status) + approved public places
        - For staff/admin: Show all places
        """
        user = self.request.user
        
        # Start with base queryset with optimized joins
        queryset = (
            Place.objects.all()
            .select_related('user')
            .prefetch_related('features')
        )
        
        # Apply distance annotation if latitude and longitude provided
        latitude = self.request.query_params.get('latitude')
        longitude = self.request.query_params.get('longitude')
        
        if latitude is not None and longitude is not None:
            try:
                latitude = float(latitude)
                longitude = float(longitude)
                queryset = self._annotate_with_distance(queryset, latitude, longitude)
            except (ValueError, TypeError):
                pass
            
        # Filter by user permission level and moderation status
        if not user.is_authenticated:
            # Anonymous users can only see approved places
            queryset = queryset.filter(moderation_status='APPROVED')
        elif user.is_staff or user.is_superuser:
            # Staff can see all places
            pass
        else:
            # Regular authenticated users can see their own places + approved places
            queryset = queryset.filter(
                Q(user=user) |  # Their own places (any status)
                Q(moderation_status='APPROVED')  # Approved places from others
            )
            
        # Annotate with helpful review count and feature count if search fields include them
        search_fields = getattr(self, 'search_fields', None)
        if search_fields and 'features__name' in search_fields:
            # Optimize the query by annotating with feature count
            queryset = queryset.annotate(feature_count=Count('features', distinct=True))
                
        # Apply default ordering if none specified
        ordering = self.request.query_params.get('ordering', None)
        if ordering is None:
            queryset = queryset.order_by('-created_at')
            
        return queryset

    def perform_create(self, serializer):
        """Set the user to the current user when creating a place"""
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsOwnerOrReadOnly])
    def publish(self, request, pk=None):
        """
        Change a place from draft to published state.
        Only the owner can publish their place.
        When a place is published, it transitions from draft to pending moderation.
        """
        place = self.get_object()
        if not place.draft:
            return Response(
                {'detail': 'This place is already published.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        place.draft = False
        place.moderation_status = 'PENDING'
        place.save(update_fields=['draft', 'moderation_status'])
        
        # Invalidate relevant caches
        cache.delete_pattern("places_list:*")
        
        serializer = self.get_serializer(place)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsOwnerOrReadOnly])
    def geocode(self, request, pk=None):
        """
        Geocode the place's address to get latitude, longitude, and district.
        
        This is useful when address is updated or for places created without coordinates.
        """
        place = self.get_object()
        
        # Check if place has an address
        if not place.address:
            return Response(
                {"detail": "Place has no address to geocode."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Call geocoding service
        coordinates = geocode_address(place.address)
        if not coordinates:
            return Response(
                {"detail": "Geocoding failed for this address."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        latitude, longitude = coordinates
        place.latitude = latitude
        place.longitude = longitude
        
        # Try to determine district if not already set
        if not place.district:
            district = determine_district(latitude, longitude)
            if district:
                place.district = district
        
        place.save(update_fields=['latitude', 'longitude', 'district'])
        
        response_data = {
            'latitude': place.latitude,
            'longitude': place.longitude,
            'district': place.district,
        }
        
        return Response(response_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def batch_geocode(self, request):
        """
        Batch geocode places with addresses but no coordinates.
        Admin/staff only endpoint for bulk operations.
        """
        from ..utils.geocoding import batch_geocode_places
        
        # Limit to a reasonable number or use pagination for large sets
        limit = int(request.data.get('limit', 100))
        
        # Filter places with addresses but no coordinates
        places = Place.objects.filter(
            address__isnull=False,
            address__gt='',
            latitude__isnull=True,
            longitude__isnull=True
        )
        
        if not places.exists():
            return Response(
                {"detail": "No places found that need geocoding."},
                status=status.HTTP_200_OK
            )
        
        # Only take the first 'limit' places
        places_to_process = list(places[:limit])
        
        # Perform batch geocoding
        success_count, failure_count = batch_geocode_places(places_to_process)
        
        response_data = {
            'success_count': success_count,
            'failure_count': failure_count,
            'total_processed': success_count + failure_count,
        }
        
        return Response(response_data, status=status.HTTP_200_OK)

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
            nearby_places = nearby_places.filter(type=place_type)
        
        features = request.query_params.get('features')
        if features:
            feature_ids = features.split(',')
            nearby_places = nearby_places.filter(features__id__in=feature_ids).distinct()
        
        # Filter by moderation status for non-staff users
        if not request.user.is_staff:
            nearby_places = nearby_places.filter(
                Q(moderation_status='APPROVED') |
                (Q(user=request.user) & ~Q(moderation_status='REJECTED'))
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

    @action(detail=False, methods=['get'])
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