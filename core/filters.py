from django_filters import rest_framework as filters
from django.db.models import Q
from .models import Place, Feature, Review, Notification, Photo
from .choices import PLACE_TYPE_CHOICES, PRICE_RANGE_CHOICES

class PlaceFilter(filters.FilterSet):
    """Filter set for Place model."""
    name = filters.CharFilter(lookup_expr='icontains')
    type = filters.ChoiceFilter(choices=PLACE_TYPE_CHOICES)
    price_range = filters.ChoiceFilter(choices=PRICE_RANGE_CHOICES)
    min_rating = filters.NumberFilter(field_name='average_rating', lookup_expr='gte')
    max_rating = filters.NumberFilter(field_name='average_rating', lookup_expr='lte')
    features = filters.CharFilter(method='filter_features')
    
    class Meta:
        model = Place
        fields = ['name', 'type', 'price_range', 'min_rating', 'max_rating', 'features']
    
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
    """Filter set for Photo model."""
    uploader = filters.NumberFilter(field_name='uploader__id')
    is_primary = filters.BooleanFilter()
    created_after = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    
    class Meta:
        model = Photo
        fields = ['uploader', 'is_primary', 'created_after', 'created_before'] 