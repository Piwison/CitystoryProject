from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank, SearchHeadline, TrigramSimilarity
from django.db.models import F, Value, CharField, Q, Case, When, FloatField, ExpressionWrapper
from django.db.models.functions import Concat, Greatest
from django.http import JsonResponse
from django.core.cache import cache
from django.conf import settings
from django.db import transaction
import logging

from ..models import Place
from ..serializers import PlaceSerializer
from ..choices import DISTRICT_CHOICES

logger = logging.getLogger(__name__)

class SearchPagination(PageNumberPagination):
    """Custom pagination class for search results."""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    page_query_param = 'page'

class FullTextSearchView(APIView):
    """
    Enhanced full-text search API with proper error handling and performance optimization.
    
    Features:
    - Multi-field search with proper weights
    - Fuzzy matching with trigram similarity
    - Result highlighting
    - Robust error handling
    - Query caching
    """
    pagination_class = SearchPagination
    
    def get_paginated_response(self, queryset, request, additional_data=None):
        """Return paginated response with highlights and relevance scores."""
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = PlaceSerializer(page, many=True)
        
        results = serializer.data
        for i, item in enumerate(page):
            if hasattr(item, 'rank'):
                results[i]['relevance'] = float(item.rank)
            if hasattr(item, 'highlights'):
                results[i]['highlights'] = item.highlights
        
        response_data = {
            'count': paginator.page.paginator.count,
            'next': paginator.get_next_link(),
            'previous': paginator.get_previous_link(),
            'results': results
        }
        
        if additional_data:
            response_data.update(additional_data)
            
        return Response(response_data)
    
    @transaction.atomic
    def get(self, request, *args, **kwargs):
        query = request.query_params.get('q', '').strip()
        highlight = request.query_params.get('highlight', 'true').lower() == 'true'
        fuzzy = request.query_params.get('fuzzy', 'true').lower() == 'true'
        min_rank = float(request.query_params.get('min_rank', 0.1))
        place_type = request.query_params.get('type')
        
        logger.info(f"Search request: query='{query}', fuzzy={fuzzy}, highlight={highlight}")
        
        # Validate query
        if not query:
            return Response(
                {'error': 'Search query parameter "q" is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check cache first
        cache_key = f"search:{hash(query)}:{place_type}:{highlight}:{fuzzy}:{min_rank}"
        cached_results = cache.get(cache_key)
        if cached_results:
            logger.info(f"Returning cached results for query: {query}")
            return Response(cached_results)
        
        try:
            # Base queryset - only approved places
            queryset = Place.objects.filter(
                moderation_status='APPROVED',
                draft=False
            )
            
            # Add place type filter if specified
            if place_type:
                queryset = queryset.filter(place_type=place_type)
            
            # Create search components
            search_vector = (
                SearchVector('name', weight='A', config='english') +
                SearchVector('description', weight='B', config='english') + 
                SearchVector('address', weight='C', config='english')
            )
            
            # Always use websearch for more robust parsing of user queries (quotes, negation, etc.)
            search_query = SearchQuery(query, search_type='websearch', config='english')
            
            # Execute search with ranking
            queryset = queryset.annotate(
                rank=SearchRank(search_vector, search_query),
                similarity=Value(0.0, output_field=FloatField()) # Add dummy similarity for UNION compatibility
            ).filter(
                rank__gt=min_rank
            )
            
            # Handle explicit negations from websearch-style query
            negated_terms = [term[1:] for term in query.split() if term.startswith('-') and len(term) > 1]
            if negated_terms:
                logger.info(f"Applying hard exclusion for negated terms: {negated_terms}")
                for term_to_negate in negated_terms:
                    # Exclude if any of the main text fields contain the negated term
                    queryset = queryset.exclude(
                        Q(name__icontains=term_to_negate) |
                        Q(description__icontains=term_to_negate) |
                        Q(address__icontains=term_to_negate)
                    )

            logger.info(f"Initial search found {queryset.count()} results")
            
            # Add fuzzy search if enabled and few results, AND no hard negations were processed
            if fuzzy and queryset.count() < 5 and not negated_terms:
                logger.info("Adding fuzzy search due to low result count and no negations")
                
                # Trigram similarity search
                trigram_queryset = Place.objects.filter(
                    moderation_status='APPROVED',
                    draft=False
                ).annotate(
                    similarity=Greatest(
                        TrigramSimilarity('name', query),
                        TrigramSimilarity('description', query),
                        TrigramSimilarity('address', query)
                    )
                ).filter(
                    similarity__gt=0.2
                ).annotate(
                    rank=ExpressionWrapper(F('similarity') * 0.8, output_field=FloatField())  # Lower weight for fuzzy matches
                )
                
                if place_type:
                    trigram_queryset = trigram_queryset.filter(place_type=place_type)
                
                # Combine results, avoiding duplicates
                exact_ids = set(queryset.values_list('id', flat=True))
                fuzzy_results = trigram_queryset.exclude(id__in=exact_ids)
                
                # Union the querysets
                queryset = queryset.union(fuzzy_results, all=False)
                logger.info(f"After fuzzy search: {queryset.count()} total results")
            
            # Order by relevance
            queryset = queryset.order_by('-rank')
            
            # Add highlighting if requested
            if highlight:
                self._add_highlights(queryset, search_query)
            
            # Prepare response data
            additional_data = {
                'query': query,
                'fuzzy_enabled': fuzzy,
                'total_results': queryset.count()
            }
            
            # Cache results if reasonable size
            if queryset.count() < 100:
                response = self.get_paginated_response(queryset, request, additional_data)
                cache.set(cache_key, response.data, timeout=300)  # 5 minutes
                return response
            
            return self.get_paginated_response(queryset, request, additional_data)
            
        except Exception as e:
            logger.error(f"Search error for query '{query}': {str(e)}", exc_info=True)
            return Response(
                {'error': 'Search temporarily unavailable. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _add_highlights(self, queryset, search_query):
        """Add search result highlighting to queryset objects."""
        try:
            fields_to_highlight = ['name', 'description', 'address']
            
            for place in queryset:
                highlights = {}
                for field in fields_to_highlight:
                    try:
                        # Get field value
                        field_value = getattr(place, field, '')
                        if not field_value:
                            continue
                            
                        # Create headline
                        headline = SearchHeadline(
                            field,
                            search_query,
                            start_sel='<mark>',
                            stop_sel='</mark>',
                            max_fragments=2,
                            min_words=5,
                            max_words=20
                        )
                        
                        # Execute headline query
                        highlighted = Place.objects.filter(
                            id=place.id
                        ).annotate(
                            highlight=headline
                        ).values_list('highlight', flat=True).first()
                        
                        if highlighted and '<mark>' in highlighted:
                            highlights[field] = highlighted
                            
                    except Exception as field_error:
                        logger.warning(f"Highlighting failed for field {field}: {str(field_error)}")
                        continue
                
                place.highlights = highlights
                
        except Exception as e:
            logger.warning(f"Highlighting disabled due to error: {str(e)}")

class CombinedSearchView(APIView):
    """Enhanced combined search with filters and geolocation."""
    pagination_class = SearchPagination
    
    def get(self, request):
        query = request.query_params.get('q', '').strip()
        place_type = request.query_params.get('type')
        districts_param = request.query_params.get('district')
        price_min = request.query_params.get('minPrice')
        price_max = request.query_params.get('maxPrice')
        features = request.query_params.get('features')
        sort = request.query_params.get('sort', 'relevance')
        
        logger.info(f"Combined search: q='{query}', type={place_type}, districts={districts_param}")
        
        try:
            # Base queryset
            queryset = Place.objects.filter(
                moderation_status='APPROVED',
                draft=False
            )
            
            # Text search if query provided
            if query:
                search_vector = (
                    SearchVector('name', weight='A', config='english') +
                    SearchVector('description', weight='B', config='english') +
                    SearchVector('address', weight='C', config='english')
                )
                search_query = SearchQuery(query, search_type='plain', config='english')
                
                queryset = queryset.annotate(
                    rank=SearchRank(search_vector, search_query)
                ).filter(rank__gt=0.1)
                
                # Fallback to icontains if no results
                if queryset.count() == 0:
                    logger.info("No full-text results, falling back to icontains")
                    queryset = Place.objects.filter(
                        moderation_status='APPROVED',
                        draft=False
                    ).filter(
                        Q(name__icontains=query) |
                        Q(description__icontains=query) |
                        Q(address__icontains=query)
                    ).annotate(rank=Value(0.1, output_field=FloatField()))
            else:
                queryset = queryset.annotate(rank=Value(0.0, output_field=FloatField()))
            
            # Apply filters
            if place_type:
                queryset = queryset.filter(place_type=place_type)
                
            if districts_param:
                district_values = [d.strip() for d in districts_param.split(',')]
                valid_districts = [d[0] for d in DISTRICT_CHOICES]
                filtered_districts = [d for d in district_values if d in valid_districts]
                if filtered_districts:
                    queryset = queryset.filter(district__in=filtered_districts)
                    
            if price_min:
                queryset = queryset.filter(price_level__gte=int(price_min))
            if price_max:
                queryset = queryset.filter(price_level__lte=int(price_max))
                
            if features:
                feature_ids = [int(f) for f in features.split(',') if f.isdigit()]
                if feature_ids:
                    queryset = queryset.filter(features__id__in=feature_ids).distinct()
            
            # Apply sorting
            if sort == 'rating':
                queryset = queryset.order_by('-avg_rating', '-rank')
            elif sort == 'name':
                queryset = queryset.order_by('name')
            else:  # relevance
                queryset = queryset.order_by('-rank', '-avg_rating')
            
            # Paginate
            paginator = self.pagination_class()
            page = paginator.paginate_queryset(queryset, request)
            
            response_data = {
                'query': query,
                'count': paginator.page.paginator.count if page else queryset.count(),
                'next': paginator.get_next_link(),
                'previous': paginator.get_previous_link(),
                'results': PlaceSerializer(page, many=True).data if page else []
            }
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Combined search error: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Search temporarily unavailable'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )