from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import get_user_model
from django.utils import timezone
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

class AdminUserStatusView(generics.UpdateAPIView):
    """
    API view for administrators to change a user's status.
    """
    permission_classes = [IsAdminUser]
    queryset = User.objects.all()
    
    def get_object(self):
        user_id = self.kwargs.get('user_id')
        return self.queryset.get(id=user_id)
    
    def patch(self, request, *args, **kwargs):
        user = self.get_object()
        is_active = request.data.get('is_active')
        
        if is_active is None:
            return Response(
                {"detail": "is_active field is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Convert to boolean (handles string values like "true"/"false")
            is_active = is_active if isinstance(is_active, bool) else is_active.lower() == 'true'
            
            # Update user status
            user.is_active = is_active
            user.save(update_fields=['is_active'])
            
            # Log the status change
            action = "activated" if is_active else "suspended"
            logger.info(f"Admin {request.user.id} {action} user {user.id}")
            
            return Response({
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "is_active": user.is_active,
                "status": "ACTIVE" if user.is_active else "SUSPENDED"
            })
            
        except Exception as e:
            logger.exception(f"Error changing user status: {str(e)}")
            return Response(
                {"detail": f"Failed to update user status: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def self_deactivate_view(request):
    """
    API view for users to deactivate their own accounts.
    """
    user = request.user
    
    try:
        # Deactivate the user's account
        user.is_active = False
        user.save(update_fields=['is_active'])
        
        logger.info(f"User {user.id} self-deactivated their account")
        
        return Response({
            "detail": "Your account has been successfully deactivated."
        })
        
    except Exception as e:
        logger.exception(f"Error during self-deactivation: {str(e)}")
        return Response(
            {"detail": f"Failed to deactivate account: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) 