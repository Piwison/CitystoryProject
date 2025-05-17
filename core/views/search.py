from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank, SearchHeadline, TrigramSimilarity
from django.db.models import F, Value, CharField, Q, Case, When, FloatField, ExpressionWrapper
from django.db.models.functions import Concat, Greatest, Radians, ACos, Cos, Sin
from django.http import JsonResponse
from django.core.cache import cache
from django.conf import settings

from ..models import Place
from ..serializers import PlaceSerializer
from ..choices import DISTRICT_CHOICES

# Constants for geolocation calculations
EARTH_RADIUS_KM = 6371.0  # Earth's radius in kilometers

class SearchPagination(PageNumberPagination):
    """
    Custom pagination class for search results.
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    page_query_param = 'page'

class FullTextSearchView(APIView):
    """
    API view for performing full-text search across places.
    
    Supports:
    - Multi-field search across name, description, and address
    - Relevance ranking of results
    - Fuzzy matching for typos and spelling variations
    - Text highlighting for matched terms
    - Configurable search weights by field
    - Pagination of results
    - Caching for frequent searches
    - Advanced search syntax (quotes for exact phrases, minus for exclusion)
    """
    pagination_class = SearchPagination
    
    def get_paginated_response(self, queryset, request, additional_data=None):
        """
        Return a paginated response for the given queryset.
        """
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = PlaceSerializer(page, many=True)
        
        # Add highlights and additional data to the results
        results = serializer.data
        for i, item in enumerate(page):
            # Add rank value to each result
            if hasattr(item, 'rank'):
                results[i]['relevance'] = float(item.rank)
            
            # Add highlights if they exist
            if hasattr(item, 'highlights'):
                results[i]['highlights'] = item.highlights
        
        # Build response with pagination info
        response_data = {
            'count': paginator.page.paginator.count,
            'next': paginator.get_next_link(),
            'previous': paginator.get_previous_link(),
            'results': results
        }
        
        # Add any additional data
        if additional_data:
            response_data.update(additional_data)
            
        return Response(response_data)
    
    def get(self, request):
        """
        Perform a full-text search across places.
        
        Query parameters:
        - q: The search query (required)
        - highlight: Whether to highlight matching terms (default: true)
        - limit: Maximum number of results to return (default: 20)
        - fields: Comma-separated list of fields to search in (default: name,description,address)
        - fuzzy: Whether to use fuzzy matching for typos (default: true)
        - min_rank: Minimum rank threshold for results (default: 0.1)
        - page: Page number for pagination
        - page_size: Number of results per page
        """
        # Get query parameters
        query = request.query_params.get('q', None)
        highlight = request.query_params.get('highlight', 'true').lower() == 'true'
        fuzzy = request.query_params.get('fuzzy', 'true').lower() == 'true'
        min_rank = float(request.query_params.get('min_rank', 0.1))
        fields = request.query_params.get('fields', 'name,description,address').split(',')
        
        # Validate query
        if not query:
            return Response(
                {'error': 'Search query parameter "q" is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check cache for frequent searches
        cache_key = f"search:{query}:{','.join(fields)}:{highlight}:{fuzzy}:{min_rank}"
        cached_results = cache.get(cache_key)
        if cached_results:
            return Response(cached_results)
        
        # Default to all fields if none are specified
        if not fields or '' in fields:
            fields = ['name', 'description', 'address', 'district']
        
        # Define field weights (higher values mean higher importance)
        weights = {
            'name': 'A',       # Highest weight
            'description': 'B', # Medium weight
            'address': 'C',     # Lower weight
            'district': 'D'     # Lowest weight
        }
        
        # Filter valid fields and create search vectors with weights
        valid_fields = [f for f in fields if f in weights]
        if not valid_fields:
            valid_fields = ['name', 'description', 'address']
        
        # Get all approved places
        queryset = Place.objects.filter(moderation_status='APPROVED')
        
        # Create a weighted search vector
        search_vectors = []
        for field in valid_fields:
            search_vectors.append(SearchVector(field, weight=weights.get(field, 'D')))
        
        # Combine search vectors
        search_vector = search_vectors[0]
        for vector in search_vectors[1:]:
            search_vector += vector
        
        # Create search query with websearch configuration (supports quotes, minus, etc.)
        search_query = SearchQuery(query, search_type='websearch')
        
        # First try exact matching
        queryset = queryset.annotate(rank=SearchRank(search_vector, search_query))
        exact_matches = queryset.filter(rank__gt=min_rank)
        
        # If fuzzy matching is enabled and we don't have enough exact matches
        if fuzzy and exact_matches.count() < 5:
            # Add trigram similarity for fuzzy matching
            trigram_fields = []
            for field in valid_fields:
                trigram_fields.append(
                    TrigramSimilarity(field, query)
                )
            
            # If we have multiple fields, take the greatest trigram score
            if len(trigram_fields) > 1:
                trigram_score = Greatest(*trigram_fields)
            else:
                trigram_score = trigram_fields[0]
            
            # Combine exact and fuzzy matches
            queryset = queryset.annotate(
                exact_rank=F('rank'),
                fuzzy_rank=trigram_score,
                # Combined rank weights exact matches higher than fuzzy matches
                rank=Case(
                    When(exact_rank__gt=min_rank, then=F('exact_rank')),
                    default=F('fuzzy_rank') * 0.8,  # Scale down fuzzy matches
                    output_field=FloatField()
                )
            ).filter(
                Q(exact_rank__gt=min_rank) | Q(fuzzy_rank__gt=min_rank * 1.2)  # Higher threshold for fuzzy
            )
        else:
            queryset = exact_matches
        
        # Order by rank
        queryset = queryset.order_by('-rank')
        
        # Add highlighting if requested
        if highlight:
            try:
                for i, place in enumerate(queryset):
                    highlights = {}
                    for field in valid_fields:
                        try:
                            headline = SearchHeadline(
                                field, 
                                search_query,
                                start_sel='<mark>',
                                stop_sel='</mark>',
                                max_fragments=3,
                                min_words=10,
                                max_words=25
                            )
                            # Add the headline annotation
                            headline_value = Place.objects.filter(id=place.id).annotate(
                                headline=headline
                            ).values_list('headline', flat=True).first()
                            
                            if headline_value and '<mark>' in headline_value:
                                highlights[field] = headline_value
                        except Exception as e:
                            # Skip highlighting errors for this field
                            if settings.DEBUG:
                                import logging
                                logger = logging.getLogger(__name__)
                                logger.warning(f"Highlighting failed for field {field}: {str(e)}")
                            continue
                    
                    # Attach highlights to the place object for the paginator
                    place.highlights = highlights
            except Exception as e:
                # Disable highlighting entirely if it fails
                if settings.DEBUG:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f"Highlighting disabled due to error: {str(e)}")
        
        # Paginate and return results
        additional_data = {
            'query': query,
            'fuzzy_enabled': fuzzy
        }
        
        # Cache results for 10 minutes if not too many
        if queryset.count() < 500:
            paginated_response = self.get_paginated_response(queryset, request, additional_data)
            cache.set(cache_key, paginated_response.data, timeout=600)
            return paginated_response
        
        return self.get_paginated_response(queryset, request, additional_data)

class CombinedSearchView(APIView):
    """
    API view for performing combined search with text, location, and filters.
    
    Supports:
    - Full-text search across name, description, and address
    - Filtering by place type, district, price range, etc.
    - Multiple district selection for geographic filtering
    - Feature filtering with support for multiple features
    - Price range filtering with min/max values
    - Sorting by relevance, rating, or name
    - Pagination with proper cursor-based navigation
    - Advanced search syntax (quotes for exact phrases, minus for exclusion)
    
    District filtering:
    - Use ?district=xinyi,daan to filter places in multiple districts
    - Returns places that match any of the specified districts
    - Only valid district values from DISTRICT_CHOICES are considered
    """
    pagination_class = SearchPagination
    
    def get(self, request):
        """
        Perform a combined search with multiple criteria.
        
        Query parameters:
        - q: Text search query
        - type: Place type filter (e.g., restaurant, cafe)
        - district: District filter (single district or comma-separated list)
        - price_min, price_max: Price range filters
        - features: Comma-separated list of feature IDs to filter by
        - sort: Sort order (relevance, rating, name)
        """
        # Get basic query parameters
        query = request.query_params.get('q', None)
        place_type = request.query_params.get('type', None)
        districts = request.query_params.get('district', None)
        price_min = request.query_params.get('price_min', None)
        price_max = request.query_params.get('price_max', None)
        features = request.query_params.get('features', None)
        sort = request.query_params.get('sort', 'relevance')
        
        # Start with all approved places
        queryset = Place.objects.filter(moderation_status='APPROVED')
        
        # Apply text search if provided
        if query:
            # Create a basic search vector
            search_vector = (
                SearchVector('name') +
                SearchVector('description') +
                SearchVector('address')
            )
            
            # Create search query
            search_query = SearchQuery(query)
            
            # Apply text search
            queryset = queryset.annotate(
                rank=SearchRank(search_vector, search_query)
            ).filter(rank__gt=0.1)
        else:
            # No text search, add a default rank of 0
            queryset = queryset.annotate(rank=Value(0.0, output_field=FloatField()))
        
        # Apply filters if provided
        if place_type:
            queryset = queryset.filter(type=place_type)
            
        if districts:
            # Handle multiple districts (comma-separated)
            district_values = [d.strip() for d in districts.split(',')]
            # Validate district values
            valid_districts = [d[0] for d in DISTRICT_CHOICES]
            district_values = [d for d in district_values if d in valid_districts]
            if district_values:
                queryset = queryset.filter(district__in=district_values)
            
        if price_min:
            queryset = queryset.filter(price_range__gte=float(price_min))
            
        if price_max:
            queryset = queryset.filter(price_range__lte=float(price_max))
            
        if features:
            feature_ids = [int(f) for f in features.split(',') if f.isdigit()]
            if feature_ids:
                queryset = queryset.filter(features__id__in=feature_ids).distinct()
        
        # Apply sorting
        if sort == 'rating':
            queryset = queryset.order_by('-average_rating', '-rank', 'name')
        elif sort == 'name':
            queryset = queryset.order_by('name')
        else:  # Default to relevance
            if query:  # If we have a search query, prioritize rank
                queryset = queryset.order_by('-rank', '-average_rating', 'name')
            else:  # Otherwise fall back to rating
                queryset = queryset.order_by('-average_rating', 'name')
        
        # Set up pagination
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = PlaceSerializer(page, many=True)
        
        # Build response with pagination info
        response_data = {
            'count': paginator.page.paginator.count,
            'next': paginator.get_next_link(),
            'previous': paginator.get_previous_link(),
            'results': serializer.data
        }
        
        # Add query parameters to response for context
        if query:
            response_data['query'] = query
        
        return Response(response_data) 