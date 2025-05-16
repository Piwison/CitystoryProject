from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from ..serializers import UserRegistrationSerializer, CustomTokenObtainPairSerializer
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        # If password is missing or this is a social auth request, treat as SSO registration
        if self.request.data.get('password') is None or self.request.data.get('auth_type') in ['google']:
            context['is_social_account'] = True
        return context

    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '<missing>')
        try:
            logger.info(f"Registration attempt: email={email}, auth_type={request.data.get('auth_type', 'local')}")
            return super().post(request, *args, **kwargs)
        except Exception as e:
            logger.exception(f"Registration failed for email={email}: {str(e)}")
            # Try to extract a user-friendly error message
            msg = str(e)
            if hasattr(e, 'detail'):
                msg = e.detail
            elif hasattr(e, 'args') and e.args:
                msg = e.args[0]
            return Response({"detail": f"Registration failed: {msg}"}, status=status.HTTP_400_BAD_REQUEST)

class CustomTokenObtainPairView(TokenObtainPairView):
    permission_classes = (AllowAny,)
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        """
        Override the post method to add custom validation:
        - Check user status (blocked/suspended/deleted)
        - Update last login timestamp
        """
        try:
            # Get the email from the request
            username = request.data.get('username')
            if not username:
                return Response(
                    {"detail": "Username is required"},
                    status=status.HTTP_400_BAD_REQUEST
                    )
            user = User.objects.filter(username=username).first()
                
            # Check if user exists and is active
            user = User.objects.filter(username=username).first()
            if user and not user.is_active:
                return Response(
                    {"detail": "Your account is inactive or suspended. Please contact support."},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            # Process normal login through parent class
            response = super().post(request, *args, **kwargs)
            
            # If login successful, update last login time
            if response.status_code == status.HTTP_200_OK and user:
                user.last_login = timezone.now()
                user.save(update_fields=['last_login'])
                logger.info(f"User {user.id} logged in successfully")
                
            return response
        except Exception as e:
            logger.exception(f"Login error: {str(e)}")
            return Response(
                {"detail": "Login failed. Please check your credentials."},
                status=status.HTTP_400_BAD_REQUEST
            )

class LogoutView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Logout failed")
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST) 