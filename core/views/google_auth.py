from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.conf import settings
import json
import logging
import requests
from google.oauth2 import id_token
from google.auth.transport import requests as google_auth_requests
from django.contrib.auth.models import AbstractBaseUser
from django.utils.crypto import get_random_string

User = get_user_model()
logger = logging.getLogger(__name__)

class GoogleOAuthCallbackView(APIView):
    """
    Handles callbacks from the Google OAuth sign-in process.
    This view expects the authorization `code` from the frontend
    and performs server-side ID token verification.
    """
    permission_classes = (AllowAny,)
    
    def post(self, request):
        logger.info(f"Google OAuth callback received: {json.dumps(request.data, default=str)[:200]}...")
        
        # The frontend sends the authorization code obtained from Google
        code = request.data.get('code')
        # Optional: You can also include 'state' parameter for CSRF protection
        # state = request.data.get('state') 
        
        if not code:
            logger.error("Missing authorization code in Google OAuth callback.")
            return Response(
                {"detail": "Authorization code is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Step 1: Exchange the authorization code for tokens (access_token and id_token)
            # This is a POST request to Google's token endpoint
            token_url = "https://oauth2.googleapis.com/token"
            token_data = {
                'code': code,
                'client_id': settings.GOOGLE_OAUTH_CLIENT_ID,         # Your Google Client ID from settings
                'client_secret': settings.GOOGLE_OAUTH_CLIENT_SECRET, # Your Google Client Secret from settings
                'redirect_uri': settings.GOOGLE_OAUTH_REDIRECT_URI,   # Must exactly match the redirect_uri configured in Google Cloud Console
                'grant_type': 'authorization_code',
            }
            
            token_response = requests.post(token_url, data=token_data)
            token_response.raise_for_status() # Raises HTTPError for bad responses (4xx or 5xx)
            tokens = token_response.json()
            
            id_token_str = tokens.get('id_token')
            if not id_token_str:
                logger.error("No ID token received from Google.")
                return Response(
                    {"detail": "Failed to get ID token from Google."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Step 2: Verify the ID token and extract user information securely
            # The id_token.verify_oauth2_token function automatically verifies audience (aud),
            # issuer (iss), and expiry (exp).
            # You need to install the 'google-auth' library: pip install google-auth
            google_id_info = id_token.verify_oauth2_token(
                id_token_str, google_auth_requests.Request(), settings.GOOGLE_OAUTH_CLIENT_ID
            )
            
            # Extract user data directly from the verified ID token payload
            google_id = google_id_info['sub']  # Google-provided unique user ID
            email = google_id_info.get('email')
            first_name = google_id_info.get('given_name', '') or google_id_info.get('first_name', '')
            last_name = google_id_info.get('family_name', '') or google_id_info.get('last_name', '')
            avatar_url = google_id_info.get('picture', '')     # 'picture' is the profile picture URL

            if not google_id or not email:
                logger.error(f"Missing required fields after ID token verification: google_id={google_id}, email={email}")
                return Response(
                    {"detail": "Google ID and email are required after verification."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # --- User creation/linking logic (similar to your original script) ---
            # Attempt to find user by google_id first
            user = User.objects.filter(google_id=google_id).first()
            
            if not user:
                # If no user found by google_id, try to find by email
                user = User.objects.filter(email=email).first()
                
                if user:
                    # Existing user found by email, link their Google account
                    user.google_id = google_id
                    user.auth_type = 'google' # Assuming 'auth_type' field exists on your User model
                    user.save()
                    logger.info(f"Linked Google account {google_id} to existing user {user.id}")
                else:
                    # No existing user found, create a new one
                    username = email.split('@')[0]
                    counter = 1
                    # Ensure username is unique
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
                        is_active=True # Mark new user as active
                    )
                    
                    # Set a random password for SSO-registered users (they won't use it directly)
                    password = get_random_string(12)
                    user.set_password(password)
                    user.save()
                    
                    logger.info(f"Created new user {user.id} with Google account {google_id}")
            
            # Update last login timestamp for the user
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            
            # Generate JWT tokens for the authenticated user
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            
            # Prepare the response data
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
            
        except requests.exceptions.RequestException as e:
            # Handle network or HTTP errors when communicating with Google's API
            logger.exception(f"Error communicating with Google OAuth API: {e}")
            return Response(
                {"detail": "Failed to communicate with Google authentication service."},
                status=status.HTTP_502_BAD_GATEWAY # Indicates an issue with an upstream service
            )
        except ValueError as e: 
            # Handle invalid ID token errors (e.g., signature mismatch, expired token)
            logger.exception(f"Invalid Google ID Token: {e}")
            return Response(
                {"detail": "Invalid or expired Google ID token."},
                status=status.HTTP_401_UNAUTHORIZED # Unauthorized because the token is invalid
            )
        except Exception as e:
            # Catch any other unexpected errors during the process
            logger.exception(f"Google OAuth callback unexpected error: {str(e)}")
            return Response(
                {"detail": f"Authentication failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )