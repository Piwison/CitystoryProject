from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from rest_framework import status
from django.utils import timezone

User = get_user_model()

class UserStatusManagementTest(TestCase):
    """Test suite for User Status Management functionality."""
    
    def setUp(self):
        """Set up test users with different statuses."""
        self.client = APIClient()
        
        # Create admin user
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpass123',
            is_staff=True,
            is_superuser=True
        )
        
        # Create active regular user
        self.active_user = User.objects.create_user(
            username='active',
            email='active@example.com',
            password='userpass123',
            is_active=True
        )
        
        # Create suspended user (is_active=False to simulate suspended status)
        self.suspended_user = User.objects.create_user(
            username='suspended',
            email='suspended@example.com',
            password='userpass123',
            is_active=False
        )
        
        # URLs
        self.login_url = reverse('token_obtain_pair')
        self.admin_status_change_url = lambda user_id: reverse('admin-user-status', args=[user_id])
        self.self_deactivate_url = reverse('self-deactivate')
        
        # Use a simple URL for testing protected routes
        # The actual name depends on your URLs, but it should be a view that requires authentication
        self.protected_route_url = "/api/places/"
        
    def authenticate_client(self, user, password=None):
        """
        Authenticate the test client as the given user using JWT.
        Sets the Authorization header for subsequent requests.
        """
        if password is None:
            password = 'userpass123'
        # Clear any previous credentials
        self.client.credentials()
        # Obtain JWT token
        response = self.client.post(self.login_url, {
            'username': user.username,
            'password': password
        })
        assert response.status_code in (200, 201), (
            f"Authentication failed for user {user.username}: {response.status_code} {response.data}"
        )
        access_token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        return access_token

    # Admin Status Change Endpoint Tests
    
    def test_admin_can_change_user_status(self):
        """Test that an admin can change a user's status."""
        # Authenticate as admin
        self.authenticate_client(self.admin_user, password='adminpass123')
        
        # Try to suspend an active user
        response = self.client.patch(
            self.admin_status_change_url(self.active_user.id),
            {'is_active': False}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify the user's status was updated in the database
        self.active_user.refresh_from_db()
        self.assertFalse(self.active_user.is_active)
        
        # Try to reactivate a suspended user
        response = self.client.patch(
            self.admin_status_change_url(self.suspended_user.id),
            {'is_active': True}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify the user's status was updated in the database
        self.suspended_user.refresh_from_db()
        self.assertTrue(self.suspended_user.is_active)
    
    def test_non_admin_cannot_change_user_status(self):
        """Test that non-admin users cannot change user statuses."""
        # Authenticate as regular user
        self.authenticate_client(self.active_user)
        
        # Try to suspend another user
        response = self.client.patch(
            self.admin_status_change_url(self.suspended_user.id),
            {'is_active': True}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    # Middleware Tests
    
    def test_suspended_user_cannot_access_protected_routes(self):
        """Test that suspended users cannot access protected routes."""
        # Try to authenticate as suspended user (should pass since we're not checking at auth time)
        login_response = self.client.post(self.login_url, {
            'username': self.suspended_user.username,
            'password': 'userpass123'
        })
        
        # This should fail with 403 since is_active=False users should not be able to log in
        self.assertEqual(login_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('inactive or suspended', login_response.data['detail'].lower())
    
    def test_active_user_can_access_protected_routes(self):
        """Test that active users can access protected routes."""
        # Authenticate as active user
        self.authenticate_client(self.active_user)
        
        # Try to access a protected route
        response = self.client.get(self.protected_route_url)
        self.assertNotEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    # Self-Deactivation API Tests
    
    def test_user_can_deactivate_own_account(self):
        """Test that users can deactivate their own accounts."""
        # Authenticate as active user
        self.authenticate_client(self.active_user)
        
        # Attempt to deactivate own account
        response = self.client.post(self.self_deactivate_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify the user's status was updated in the database
        self.active_user.refresh_from_db()
        self.assertFalse(self.active_user.is_active)
    
    def test_unauthenticated_user_cannot_self_deactivate(self):
        """Test that unauthenticated users cannot use the self-deactivation endpoint."""
        # No authentication, try to deactivate
        response = self.client.post(self.self_deactivate_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    # Status-Aware Authentication Tests
    
    def test_login_blocked_for_suspended_user(self):
        """Test that suspended users cannot log in."""
        # Try to authenticate as suspended user
        response = self.client.post(self.login_url, {
            'username': self.suspended_user.username,
            'password': 'userpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('inactive or suspended', response.data['detail'].lower())
    
    def test_token_invalidation_on_status_change(self):
        """Test that existing tokens are invalidated when user status changes."""
        # First authenticate as active user
        login_response = self.client.post(self.login_url, {
            'username': self.active_user.username,
            'password': 'userpass123'
        })
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        access_token = login_response.data['access']
        
        # Use the token to access a protected route
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        initial_response = self.client.get(self.protected_route_url)
        self.assertNotEqual(initial_response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Now suspend the user (directly via model)
        self.active_user.is_active = False
        self.active_user.save()
        
        # Try to use the same token again
        token_verify_response = self.client.post(reverse('token_verify'), {'token': access_token})
        self.assertEqual(token_verify_response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Try to access a protected route with the same token
        protected_response = self.client.get(self.protected_route_url)
        self.assertEqual(protected_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_last_login_timestamp_updated(self):
        """Test that the last_login timestamp is updated when a user logs in."""
        # Clear last_login
        self.active_user.last_login = None
        self.active_user.save()
        
        # User logs in
        self.client.post(self.login_url, {
            'username': self.active_user.username,
            'password': 'userpass123'
        })
        
        # Check that last_login was updated
        self.active_user.refresh_from_db()
        self.assertIsNotNone(self.active_user.last_login)
        self.assertAlmostEqual(
            self.active_user.last_login.timestamp(),
            timezone.now().timestamp(),
            delta=60  # Allow 60 seconds difference
        ) 