"""
Core app views package.
"""

from .auth import UserRegistrationView, CustomTokenObtainPairView, LogoutView
from .places import PlaceViewSet
from .reviews import ReviewViewSet
from .photos import PhotoViewSet
from .moderation import (
    PlaceModerationViewSet,
    ReviewModerationViewSet,
    PhotoModerationViewSet
)
# from .users import UserViewSet  # Removed, file does not exist
from .google_auth import GoogleOAuthCallbackView
from .notifications import NotificationViewSet
from .saved_places import SavedPlaceViewSet
from .features import FeatureViewSet
from .badges import (
    BadgeViewSet,
    UserBadgeViewSet,
    UserPointsViewSet,
    UserLevelViewSet,
    UserProfileViewSet
)

__all__ = [
    'UserRegistrationView',
    'CustomTokenObtainPairView',
    'LogoutView',
    'PlaceViewSet',
    'ReviewViewSet',
    'PhotoViewSet',
    'PlaceModerationViewSet',
    'ReviewModerationViewSet',
    'PhotoModerationViewSet',
    # 'UserViewSet',  # Removed, file does not exist
    'GoogleOAuthCallbackView',
    'NotificationViewSet',
    'SavedPlaceViewSet',
    'FeatureViewSet',
    'BadgeViewSet',
    'UserBadgeViewSet',
    'UserPointsViewSet',
    'UserLevelViewSet',
    'UserProfileViewSet',
] 