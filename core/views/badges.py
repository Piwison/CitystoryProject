from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Sum
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend

from ..models import Badge, UserBadge, UserPoints, UserLevel
from ..serializers import (
    BadgeSerializer, UserBadgeSerializer, UserPointsSerializer, 
    UserLevelSerializer, UserProfileSerializer
)
from ..permissions import IsOwnerOrReadOnly
from rest_framework.permissions import IsAdminUser

User = get_user_model()

class BadgeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing badges.
    
    list:
        Return a list of all available badges.
        
    retrieve:
        Return details of a specific badge.
    """
    queryset = Badge.objects.all()
    serializer_class = BadgeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'level']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'level', 'points']
    ordering = ['level', 'name']

class UserBadgeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing user badges.
    
    list:
        Return a list of badges earned by the current user.
        
    retrieve:
        Return details of a specific user badge.
        
    check_eligibility:
        Check if the user is eligible for any new badges.
    """
    serializer_class = UserBadgeSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['awarded_at']
    ordering = ['-awarded_at']
    
    def get_queryset(self):
        """Return badges for the current user."""
        return UserBadge.objects.filter(user=self.request.user).select_related('badge')
    
    @action(detail=False, methods=['post'])
    def check_eligibility(self, request):
        """
        Check if the user is eligible for any new badges.
        Awards badges if the user meets requirements.
        """
        user = request.user
        eligible_badges = Badge.check_eligibility(user)
        
        new_badges = []
        for badge in eligible_badges:
            user_badge, created = UserBadge.award_badge(user, badge)
            if created:
                new_badges.append(user_badge)
        
        if new_badges:
            serializer = self.get_serializer(new_badges, many=True)
            return Response({
                'new_badges_count': len(new_badges),
                'new_badges': serializer.data
            })
        
        return Response({
            'new_badges_count': 0,
            'message': 'No new badges earned at this time.'
        })

class UserPointsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing user points.
    
    list:
        Return a list of point transactions for the current user.
        
    retrieve:
        Return details of a specific point transaction.
        
    summary:
        Get a summary of the user's points by source type.
    """
    serializer_class = UserPointsSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['source_type']
    ordering_fields = ['created_at', 'points']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Return points for the current user."""
        return UserPoints.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get a summary of the user's points by source type."""
        user = request.user
        
        # Get total points
        total_points = UserPoints.get_total_points(user)
        
        # Get points by source type
        points_by_source = (
            UserPoints.objects
            .filter(user=user)
            .values('source_type')
            .annotate(total=Sum('points'))
            .order_by('-total')
        )
        
        # Get user level
        try:
            user_level = UserLevel.objects.get(user=user)
            level_data = UserLevelSerializer(user_level).data
        except UserLevel.DoesNotExist:
            level_data = None
        
        return Response({
            'total_points': total_points,
            'points_by_source': points_by_source,
            'level': level_data
        })

class UserLevelViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing user levels.
    
    retrieve:
        Return details of the current user's level.
    """
    serializer_class = UserLevelSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    
    def get_queryset(self):
        """Return level for the current user."""
        return UserLevel.objects.filter(user=self.request.user)
    
    def get_object(self):
        """Return the user's level object, creating it if it doesn't exist."""
        user = self.request.user
        
        # Create the level object if it doesn't exist
        user_level, created = UserLevel.objects.get_or_create(
            user=user,
            defaults={'level': 1}
        )
        
        # If created, check if the user should be at a higher level
        if created:
            UserLevel.check_level_progress(user)
            user_level.refresh_from_db()
        
        return user_level

class UserProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing user profiles with badges and points.
    
    retrieve:
        Return details of the current user's profile including badges and points.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return the current user."""
        return User.objects.filter(id=self.request.user.id)
    
    def get_object(self):
        """Return the current user."""
        return self.request.user 