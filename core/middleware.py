from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from rest_framework import status
import re
import logging

logger = logging.getLogger(__name__)

class UserStatusMiddleware(MiddlewareMixin):
    """
    Middleware to check user status on protected routes.
    If a user is suspended or deleted, they should not be able to access protected resources.
    """
    
    # Routes that don't require user status check
    PUBLIC_ROUTES = [
        r'^/api/token/?$',  # Login endpoint
        r'^/api/token/refresh/?$',  # Token refresh endpoint
        r'^/api/register/?$',  # Registration endpoint
        r'^/api/google/auth/?$',  # Google OAuth endpoint
        r'^/admin/?',  # Django admin (has its own auth)
        r'^/api/places/?$',  # Public places listing (GET method only)
        # Add other public routes here
    ]
    
    def process_view(self, request, view_func, view_args, view_kwargs):
        # Skip check if route is public
        path = request.path_info
        if request.method == 'GET' and path.startswith('/api/places'):
            return None
            
        for pattern in self.PUBLIC_ROUTES:
            if re.match(pattern, path):
                return None
                
        # Skip check if user is not authenticated
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return None
            
        # Check if user is active
        if not user.is_active:
            logger.warning(f"Inactive user {user.id} attempted to access {path}")
            return JsonResponse(
                {"detail": "Your account is suspended or inactive. Please contact support."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        return None 