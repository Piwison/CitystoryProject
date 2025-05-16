"""
Views for handling user notifications.
Provides endpoints for listing, marking as read, and managing notifications.
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from rest_framework.pagination import PageNumberPagination

from ..models import Notification
from ..serializers import NotificationSerializer
from ..filters import NotificationFilter

class NotificationPagination(PageNumberPagination):
    """Custom pagination for notifications"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for managing user notifications.
    
    list:
        Return a paginated list of notifications for the authenticated user.
        
        Filtering:
        - is_read: Filter by read status (true/false)
        - type: Filter by notification type
        - created_after: Filter by creation date
        - created_before: Filter by creation date
        
        Pagination:
        - page_size: Number of notifications per page (default: 20, max: 100)
        - page: Page number
        
    retrieve:
        Return details of a specific notification.
        
    mark_read:
        Mark one or more notifications as read.
        
    mark_all_read:
        Mark all notifications as read.
        
    unread_count:
        Get count of unread notifications.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = NotificationFilter
    pagination_class = NotificationPagination
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Return notifications for the authenticated user"""
        return (
            Notification.objects
            .filter(user=self.request.user)
            .select_related('user')
            .order_by('-created_at')
        )
    
    @action(detail=True, methods=['POST'])
    def mark_read(self, request, pk=None):
        """Mark a notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response(self.get_serializer(notification).data)
    
    @action(detail=False, methods=['POST'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        self.get_queryset().update(is_read=True)
        return Response({'status': 'success'})
    
    @action(detail=False, methods=['GET'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': count}) 