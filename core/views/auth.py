from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenVerifyView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenVerifySerializer
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model
from django.utils import timezone
from ..serializers import UserRegistrationSerializer, CustomTokenObtainPairSerializer
import logging
from rest_framework.views import APIView

User = get_user_model()
logger = logging.getLogger(__name__)

class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        # If password is missing or this is a social auth request, treat as SSO registration
        if self.request.data.get('password') is None or self.request.data.get('auth_type') or self.request.data.get('auth_type') in ['google']:
            context['is_social_account'] = True
        return context

    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '<missing>')
        try:
            logger.info(f"Registration attempt: email={email}, auth_type={request.data.get('auth_type', 'local')}")
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.save()

            # Generate JWT tokens for the new user
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

            # Prepare user data (you may want to use a UserSerializer)
            user_data = serializer.data

            return Response({
                "token": access_token,
                "refreshToken": refresh_token,
                "user": user_data
            }, status=status.HTTP_201_CREATED)
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
                status=status.HTTP_401_UNAUTHORIZED
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

class ConvertSessionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        name = request.data.get('name', '')
        if not email:
            return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        User = get_user_model()
        user, created = User.objects.get_or_create(email=email)
        # Set first_name if provided and not already set
        if name and (created or not user.first_name):
            user.first_name = name
            user.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'token': str(refresh.access_token),
            'refreshToken': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.first_name,  # Use first_name for display
            }
        })

class CustomTokenVerifySerializer(TokenVerifySerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        from rest_framework_simplejwt.tokens import UntypedToken
        user_id = UntypedToken(attrs['token'])['user_id']
        user = User.objects.filter(id=user_id).first()
        if user and not user.is_active:
            raise AuthenticationFailed('User is inactive or suspended')
        return data

class CustomTokenVerifyView(TokenVerifyView):
    """
    Custom token verify endpoint that also checks if the user is active.
    Returns 401 if the user is inactive or suspended.
    """
    serializer_class = CustomTokenVerifySerializer

# NOTE: To activate this, update your urls.py:
# from core.views.auth import CustomTokenVerifyView
# path('api/token/verify/', CustomTokenVerifyView.as_view(), name='token_verify'),
# This will ensure that /api/token/verify/ uses the custom logic. 