from django_filters import rest_framework as filters
from django.db.models import Q
from .models import Place, Feature, Review, Notification, PlacePhoto
from .choices import PLACE_TYPE_CHOICES, PRICE_LEVEL_CHOICES

class PlaceFilter(filters.FilterSet):
    """
    Advanced filtering for places.
    
    API Naming Convention:
    - API filter parameters use camelCase (e.g., minPrice, maxPrice, featureType)
    - These map to snake_case model fields (e.g., price_level, feature_type)
    
    Supports:
    - Price level filtering (minPrice/maxPrice -> price_level field)
    - Place type filtering with multiple selection
    - Feature filtering (name, type, has_all, has_any)
    - Geolocation-based filtering with optimized distance calculation
    - Rating-based filtering
    - Date range filtering
    - District-based filtering with multiple selection
    """
    name = filters.CharFilter(lookup_expr='icontains')
    type = filters.ChoiceFilter(choices=PLACE_TYPE_CHOICES)
    price_level = filters.ChoiceFilter(choices=PRICE_LEVEL_CHOICES)
    min_rating = filters.NumberFilter(field_name='average_rating', lookup_expr='gte')
    max_rating = filters.NumberFilter(field_name='average_rating', lookup_expr='lte')
    features = filters.CharFilter(method='filter_features')
    
    class Meta:
        model = Place
        fields = ['name', 'type', 'price_level', 'min_rating', 'max_rating', 'features']
    
    def filter_features(self, queryset, name, value):
        """Filter places by comma-separated feature IDs."""
        if not value:
            return queryset
        feature_ids = [int(id.strip()) for id in value.split(',') if id.strip().isdigit()]
        return queryset.filter(features__id__in=feature_ids).distinct()

class FeatureFilter(filters.FilterSet):
    name = filters.CharFilter(lookup_expr='icontains')
    type = filters.CharFilter(lookup_expr='exact')
    description = filters.CharFilter(lookup_expr='icontains')
    applicable_to = filters.ChoiceFilter(
        choices=PLACE_TYPE_CHOICES,
        method='filter_applicable_to',
        help_text='Filter features applicable to a specific place type'
    )
    created_after = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    def filter_applicable_to(self, queryset, name, value):
        return queryset.filter(applicable_place_types__contains=[value])

    class Meta:
        model = Feature
        fields = ['name']

class ReviewFilter(filters.FilterSet):
    """Filter set for Review model."""
    min_rating = filters.NumberFilter(field_name='overall_rating', lookup_expr='gte')
    max_rating = filters.NumberFilter(field_name='overall_rating', lookup_expr='lte')
    created_after = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    user = filters.NumberFilter(field_name='user__id')
    
    class Meta:
        model = Review
        fields = ['min_rating', 'max_rating', 'created_after', 'created_before', 'user']

class NotificationFilter(filters.FilterSet):
    """
    Filter set for Notification model.
    
    Allows filtering notifications by:
    - is_read: Read status
    - notification_type: Notification type
    - created_after: Created after date
    - created_before: Created before date
    """
    created_after = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = Notification
        fields = {
            'is_read': ['exact'],
            'notification_type': ['exact', 'in'],
        }

class PhotoFilter(filters.FilterSet):
    """Filter set for PlacePhoto model."""
    user = filters.NumberFilter(field_name='user__id')
    is_primary = filters.BooleanFilter(field_name='is_primary')
    created_after = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    
    class Meta:
        model = PlacePhoto
        fields = ['user', 'is_primary', 'created_after', 'created_before'] 