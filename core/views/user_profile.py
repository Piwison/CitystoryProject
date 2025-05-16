from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from ..models import UserLevel, UserBadge, Notification
from ..serializers import UserProfileSerializer
from django.db.models import Count
import logging

logger = logging.getLogger(__name__)

User = get_user_model()

class UserProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for retrieving user profile data.
    
    Includes user data, badges, points, and level information.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return only the current user's profile."""
        return User.objects.filter(id=self.request.user.id)
        
    def get_object(self):
        """Return the current user."""
        return self.request.user

    def get_serializer_context(self):
        """Add user to serializer context."""
        context = super().get_serializer_context()
        context['user'] = self.request.user
        return context
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        logger.debug(f"UserProfileViewSet.list() response: {serializer.data}")
        print(f"UserProfileViewSet.list() response: {serializer.data}")  # For console output
        return Response(serializer.data)

    @action(detail=False, methods=['GET'])
    def notification_count(self, request):
        """
        Get count of unread notifications for the current user.
        
        Returns:
            {
                "unread_count": <count>,
                "notification_types": {
                    "place_approved": <count>,
                    "review_rejected": <count>,
                    ...
                }
            }
        """
        user = request.user
        
        # Get total unread count
        unread_count = Notification.objects.filter(
            user=user,
            is_read=False
        ).count()
        
        # Get counts by notification type
        type_counts = Notification.objects.filter(
            user=user,
            is_read=False
        ).values('notification_type').annotate(
            count=Count('notification_type')
        )
        
        # Convert to dictionary
        notification_types = {
            item['notification_type']: item['count'] 
            for item in type_counts
        }
        
        return Response({
            'unread_count': unread_count,
            'notification_types': notification_types
        }) 