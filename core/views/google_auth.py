from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.conf import settings
import json
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

class GoogleOAuthCallbackView(APIView):
    """
    Handle callbacks from Google OAuth sign-in process.
    Expects the following data in the request:
    - googleId: The Google-provided user ID
    - email: The user's email address
    - firstName: The user's first name
    - lastName: The user's last name (optional)
    - avatar: The URL of the user's Google profile picture (optional)
    """
    permission_classes = (AllowAny,)
    
    def post(self, request):
        logger.info(f"Google OAuth callback received: {json.dumps(request.data, default=str)[:200]}...")
        
        google_id = request.data.get('googleId')
        email = request.data.get('email')
        first_name = request.data.get('firstName')
        last_name = request.data.get('lastName', '')
        avatar_url = request.data.get('avatar')
        
        if not google_id or not email:
            logger.error(f"Missing required fields: googleId={google_id}, email={email}")
            return Response(
                {"detail": "Google ID and email are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Check if user exists by google_id
            user = User.objects.filter(google_id=google_id).first()
            
            if not user:
                # Check if user exists by email
                user = User.objects.filter(email=email).first()
                
                if user:
                    # Existing user found by email, link Google account
                    user.google_id = google_id
                    user.auth_type = 'google'
                    user.save()
                    logger.info(f"Linked Google account {google_id} to existing user {user.id}")
                else:
                    # Create new user
                    username = email.split('@')[0]
                    counter = 1
                    while User.objects.filter(username=username).exists():
                        username = f"{email.split('@')[0]}{counter}"
                        counter += 1
                    
                    user = User.objects.create(
                        username=username,
                        email=email,
                        first_name=first_name,
                        last_name=last_name,
                        google_id=google_id,
                        auth_type='google',
                        is_active=True
                    )
                    
                    # Set a random password
                    password = User.objects.make_random_password()
                    user.set_password(password)
                    user.save()
                    
                    logger.info(f"Created new user {user.id} with Google account {google_id}")
            
            # Update last login
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            
            response_data = {
                'access': access_token,
                'refresh': refresh_token,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'auth_type': user.auth_type,
                }
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.exception(f"Google OAuth error: {str(e)}")
            return Response(
                {"detail": f"Authentication failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 