from django.urls import path, include
from rest_framework.routers import DefaultRouter, SimpleRouter
from rest_framework_nested.routers import NestedSimpleRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from .views import (
    UserRegistrationView,
    CustomTokenObtainPairView,
    LogoutView,
    PlaceViewSet,
    ReviewViewSet,
    PhotoViewSet,
    PlaceModerationViewSet,
    ReviewModerationViewSet,
    PhotoModerationViewSet,
    NotificationViewSet,
    GoogleOAuthCallbackView,
    SavedPlaceViewSet,
    FeatureViewSet,
    BadgeViewSet,
    UserBadgeViewSet,
    UserPointsViewSet,
    UserLevelViewSet,
    UserProfileViewSet
)
from .views.user_status import AdminUserStatusView, self_deactivate_view
from .views.search import FullTextSearchView, CombinedSearchView

# Create a router for top-level endpoints
router = DefaultRouter()
router.register(r'places', PlaceViewSet, basename='place')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'features', FeatureViewSet, basename='feature')
router.register(r'saved-places', SavedPlaceViewSet, basename='saved-place')
router.register(r'badges', BadgeViewSet, basename='badge')
router.register(r'user-badges', UserBadgeViewSet, basename='user-badge')
router.register(r'user-points', UserPointsViewSet, basename='user-points')
router.register(r'user-level', UserLevelViewSet, basename='user-level')
router.register(r'user-profile', UserProfileViewSet, basename='user-profile')

# Create nested routers for place-specific endpoints
places_router = NestedSimpleRouter(router, r'places', lookup='place')
places_router.register(r'reviews', ReviewViewSet, basename='place-reviews')
places_router.register(r'photos', PhotoViewSet, basename='place-photos')

# Moderation endpoints
router.register(r'moderation/places', PlaceModerationViewSet, basename='moderation-places')
router.register(r'moderation/reviews', ReviewModerationViewSet, basename='moderation-reviews')
router.register(r'moderation/photos', PhotoModerationViewSet, basename='moderation-photos')

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('google/auth/', GoogleOAuthCallbackView.as_view(), name='google_auth'),
    
    # User status management endpoints
    path('admin/users/<int:user_id>/status/', AdminUserStatusView.as_view(), name='admin-user-status'),
    path('users/self/deactivate/', self_deactivate_view, name='self-deactivate'),
    
    # Search endpoints
    path('search/', FullTextSearchView.as_view(), name='full-text-search'),
    path('search/combined/', CombinedSearchView.as_view(), name='combined-search'),
    
    path('', include(router.urls)),
    path('', include(places_router.urls)),
] 