from django_filters import rest_framework as filters
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q

from core.models import Feature, Place
from core.serializers import FeatureSerializer, PlaceSerializer
from ..choices import PLACE_TYPE_CHOICES, FEATURE_TYPES


class FeatureFilter(filters.FilterSet):
    name = filters.CharFilter(lookup_expr='icontains')
    type = filters.ChoiceFilter(choices=FEATURE_TYPES)
    applicable_to = filters.ChoiceFilter(
        choices=PLACE_TYPE_CHOICES,
        method='filter_applicable_to',
        help_text='Filter features applicable to a specific place type'
    )
    created_after = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    def filter_applicable_to(self, queryset, name, value):
        """Filter features applicable to a specific place type"""
        if not value:
            return queryset
            
        # Either applicable_place_types is empty (applicable to all)
        # or it contains the specific place type
        return queryset.filter(
            Q(applicable_place_types='') | 
            Q(applicable_place_types__contains=value)
        )

    class Meta:
        model = Feature
        fields = ['name', 'type', 'applicable_to', 'created_after', 'created_before']


class FeatureViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing features and their categories.
    
    list:
        Return a list of all features. Features can be filtered by name, type,
        and applicable place types.
        
    create:
        Create a new feature. Must be authenticated.
        
    retrieve:
        Return the given feature.
        
    update:
        Update a feature. Must be authenticated.
        
    partial_update:
        Update a feature partially. Must be authenticated.
        
    destroy:
        Delete a feature. Must be authenticated and have appropriate permissions.
    """
    queryset = Feature.objects.all()
    serializer_class = FeatureSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_class = FeatureFilter
    ordering_fields = ['name', 'type', 'places_count']
    ordering = ['type', 'name']
    search_fields = ['name', 'description']

    @action(detail=False, methods=['get'])
    def by_place_type(self, request):
        """
        Return features filtered by place type.
        Query param: ?type=restaurant (or cafe, bar, etc.)
        """
        place_type = request.query_params.get('type')
        if not place_type:
            return Response(
                {'error': 'Place type parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if place_type not in [choice[0] for choice in PLACE_TYPE_CHOICES]:
            return Response(
                {'error': f'Invalid place type. Must be one of: {", ".join([choice[0] for choice in PLACE_TYPE_CHOICES])}'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        features = self.get_queryset().filter(applicable_place_types__contains=place_type)
        serializer = self.get_serializer(features, many=True)
        return Response(serializer.data)
        
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """
        Return all feature categories (types) with counts.
        """
        categories = []
        for type_code, type_name in FEATURE_TYPES:
            count = Feature.objects.filter(type=type_code).count()
            categories.append({
                'type': type_code,
                'name': type_name,
                'count': count
            })
        return Response(categories)
        
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """
        Return features grouped by category.
        """
        result = {}
        for type_code, type_name in FEATURE_TYPES:
            features = Feature.objects.filter(type=type_code)
            serializer = self.get_serializer(features, many=True)
            result[type_code] = {
                'name': type_name,
                'features': serializer.data
            }
        return Response(result)
        
    @action(detail=True, methods=['get'])
    def places(self, request, pk=None):
        """
        Return all places with this feature.
        """
        feature = self.get_object()
        places = feature.places.filter(moderation_status='approved')
        
        from core.serializers import PlaceSerializer
        serializer = PlaceSerializer(places, many=True)
        return Response(serializer.data)
        
    @action(detail=False, methods=['post'])
    def batch_create(self, request):
        """
        Create multiple features at once.
        
        Expects a list of feature objects in the request data.
        """
        features = request.data
        if not isinstance(features, list):
            return Response(
                {'error': 'Expected a list of features'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        created_features = []
        errors = []
        
        for i, feature_data in enumerate(features):
            serializer = self.get_serializer(data=feature_data)
            try:
                if serializer.is_valid(raise_exception=True):
                    serializer.save()
                    created_features.append(serializer.data)
            except Exception as e:
                errors.append({
                    'index': i,
                    'data': feature_data,
                    'errors': serializer.errors if hasattr(serializer, 'errors') else str(e)
                })
                
        return Response({
            'created': created_features,
            'errors': errors
        })
        
    @action(detail=False, methods=['post'])
    def associate_with_place(self, request):
        """
        Associate features with a place.
        
        Requires 'place_id' and 'feature_ids' (list) in request data.
        """
        place_id = request.data.get('place_id')
        feature_ids = request.data.get('feature_ids', [])
        
        if not place_id:
            return Response(
                {'error': 'place_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not feature_ids or not isinstance(feature_ids, list):
            return Response(
                {'error': 'feature_ids must be a non-empty list'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            place = Place.objects.get(id=place_id)
        except Place.DoesNotExist:
            return Response(
                {'error': f'Place with id {place_id} does not exist'},
                status=status.HTTP_404_NOT_FOUND
            )
            
        # Check permissions
        if place.user != request.user and not request.user.is_staff:
            return Response(
                {'error': 'You do not have permission to modify this place'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Get valid features
        valid_features = Feature.objects.filter(id__in=feature_ids)
        valid_ids = [f.id for f in valid_features]
        invalid_ids = [f_id for f_id in feature_ids if int(f_id) not in valid_ids]
        
        # Validate feature applicability
        not_applicable = []
        for feature in valid_features:
            if not feature.is_applicable_to_place_type(place.type):
                not_applicable.append({
                    'id': feature.id,
                    'name': feature.name,
                    'type': feature.type
                })
        
        if not_applicable:
            return Response({
                'error': 'Some features are not applicable to this place type',
                'not_applicable': not_applicable
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # Add features to place
        place.features.add(*valid_features)
        
        return Response({
            'success': True,
            'added': [f.id for f in valid_features],
            'invalid': invalid_ids
        }) 