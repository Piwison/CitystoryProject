import unittest
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.conf import settings
from unittest.mock import patch, MagicMock
from django.contrib.auth import get_user_model
from django.utils import timezone
import requests

User = get_user_model()

class GoogleOAuthCallbackTests(APITestCase):
    """
    Tests for the GoogleOAuthCallbackView.
    Mocks external calls to Google's API to ensure tests are fast and reliable.
    """

    def setUp(self):
        """
        Set up test configurations and mock initial settings.
        """
        # Ensure Django is in testing mode
        self.client.force_authenticate(user=None) # Ensure no authenticated user from previous tests
        
        # Configure mock Google OAuth settings for tests
        self._original_google_client_id = getattr(settings, 'GOOGLE_OAUTH_CLIENT_ID', None)
        self._original_google_client_secret = getattr(settings, 'GOOGLE_OAUTH_CLIENT_SECRET', None)
        self._original_google_redirect_uri = getattr(settings, 'GOOGLE_OAUTH_REDIRECT_URI', None)

        settings.GOOGLE_OAUTH_CLIENT_ID = "test_client_id_for_testing.apps.googleusercontent.com"
        settings.GOOGLE_OAUTH_CLIENT_SECRET = "test_client_secret_for_testing"
        # The redirect_uri used in tests should match the one expected by your view (usually a test server URL)
        settings.GOOGLE_OAUTH_REDIRECT_URI = "http://testserver/api/auth/google/callback/" 
        
        # Define the URL for your view
        self.callback_url = reverse('google-oauth-callback')

    def tearDown(self):
        """
        Clean up after tests: restore original settings and database state.
        """
        # Restore original settings to avoid affecting other tests
        if self._original_google_client_id is not None:
            settings.GOOGLE_OAUTH_CLIENT_ID = self._original_google_client_id
        if self._original_google_client_secret is not None:
            settings.GOOGLE_OAUTH_CLIENT_SECRET = self._original_google_client_secret
        if self._original_google_redirect_uri is not None:
            settings.GOOGLE_OAUTH_REDIRECT_URI = self._original_google_redirect_uri
        
        # Clean up database (APITestCase handles transaction rollback by default,
        # but explicit cleanup can be useful for complex scenarios or if not using transaction rollback)
        User.objects.all().delete()


    @patch('requests.post') # Mock the requests.post call to Google's token endpoint
    @patch('google.oauth2.id_token.verify_oauth2_token') # Mock the ID Token verification function
    def test_google_oauth_callback_new_user_registration(self, mock_verify_token, mock_requests_post):
        """
        Test case for a new user successfully registering via Google OAuth.
        """
        # 1. Mock the response from Google's token endpoint (exchange code for tokens)
        mock_requests_post.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "access_token": "mock_google_access_token_for_new_user",
                "id_token": "mock_id_token_jwt_for_new_user", # This JWT will be verified by mock_verify_token
                "expires_in": 3600
            },
            raise_for_status=lambda: None # Prevent HTTPError from being raised
        )

        # 2. Mock the result of the ID Token verification (what user data Google returns)
        mock_verify_token.return_value = {
            "sub": "google_test_id_new_user_123", # Unique Google ID
            "email": "newuser@example.com",
            "given_name": "New",
            "family_name": "User",
            "picture": "http://example.com/new_user_avatar.jpg",
            "email_verified": True,
            "name": "New User"
        }

        # 3. Send a POST request to your callback URL with the authorization code
        # The 'code' parameter is what your frontend would send to your backend.
        post_data = {"code": "mock_auth_code_for_new_user"}
        response = self.client.post(self.callback_url, data=post_data, format='json')

        # 4. Assert the response status and content
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
        
        user_data = response.data['user']
        self.assertEqual(user_data['email'], 'newuser@example.com')
        self.assertEqual(user_data['first_name'], 'New')
        self.assertEqual(user_data['last_name'], 'User')
        self.assertEqual(user_data['auth_type'], 'google')

        # 5. Assert that a new user was created in the database
        self.assertTrue(User.objects.filter(email='newuser@example.com').exists())
        user = User.objects.get(email='newuser@example.com')
        self.assertEqual(user.google_id, "google_test_id_new_user_123")
        self.assertIsNotNone(user.password) # Password should be set (random)
        self.assertGreater(user.last_login, timezone.now() - timezone.timedelta(minutes=1)) # Check last_login is recent

        # 6. Assert that external functions were called correctly
        # Check that requests.post was called with correct parameters to Google's token endpoint
        mock_requests_post.assert_called_once_with(
            "https://oauth2.googleapis.com/token",
            data={
                'code': 'mock_auth_code_for_new_user',
                'client_id': settings.GOOGLE_OAUTH_CLIENT_ID,
                'client_secret': settings.GOOGLE_OAUTH_CLIENT_SECRET,
                'redirect_uri': settings.GOOGLE_OAUTH_REDIRECT_URI,
                'grant_type': 'authorization_code',
            }
        )
        # Check that ID token verification was called with the mock ID token
        mock_verify_token.assert_called_once_with(
            "mock_id_token_jwt_for_new_user",
            unittest.mock.ANY, # The google_auth_requests.Request() object
            settings.GOOGLE_OAUTH_CLIENT_ID
        )


    @patch('requests.post')
    @patch('google.oauth2.id_token.verify_oauth2_token')
    def test_google_oauth_callback_existing_user_by_google_id(self, mock_verify_token, mock_requests_post):
        """
        Test case for an existing user logging in via Google OAuth, found by google_id.
        """
        # Pre-create a user in the database with a google_id
        existing_user = User.objects.create_user(
            username="existinggoogleuser", 
            email="existing_google@example.com", 
            google_id="google_test_id_existing_123", 
            auth_type='google',
            first_name="Existing",
            last_name="Google"
        )
        initial_last_login = existing_user.last_login

        # Mock Google API responses
        mock_requests_post.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "access_token": "mock_google_access_token_existing",
                "id_token": "mock_id_token_jwt_existing",
                "expires_in": 3600
            },
            raise_for_status=lambda: None
        )
        mock_verify_token.return_value = {
            "sub": "google_test_id_existing_123", # Matches existing user's google_id
            "email": "existing_google@example.com",
            "given_name": "Existing",
            "family_name": "Google",
            "picture": "http://example.com/existing_avatar.jpg",
            "email_verified": True
        }

        post_data = {"code": "mock_auth_code_existing_user"}
        response = self.client.post(self.callback_url, data=post_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['id'], existing_user.id)
        self.assertEqual(response.data['user']['email'], 'existing_google@example.com')
        
        # Assert that no new user was created
        self.assertEqual(User.objects.count(), 1) 
        
        # Assert last_login was updated
        updated_user = User.objects.get(id=existing_user.id)
        if initial_last_login is None:
            self.assertIsNotNone(updated_user.last_login)
        else:
            self.assertGreater(updated_user.last_login, initial_last_login)
        self.assertEqual(updated_user.google_id, "google_test_id_existing_123")
        self.assertEqual(updated_user.auth_type, "google")


    @patch('requests.post')
    @patch('google.oauth2.id_token.verify_oauth2_token')
    def test_google_oauth_callback_existing_user_by_email_then_link_google_id(self, mock_verify_token, mock_requests_post):
        """
        Test case for an existing user (registered via email/password)
        logging in via Google OAuth for the first time, linking their Google ID.
        """
        # Pre-create a user who does NOT have a google_id initially
        existing_user_no_google_id = User.objects.create_user(
            username="existingemailuser", 
            email="existing_email@example.com", 
            password="testpassword", 
            auth_type='email',
            first_name="Email",
            last_name="User"
        )
        self.assertIsNone(existing_user_no_google_id.google_id) # Ensure no google_id initially

        # Mock Google API responses
        mock_requests_post.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "access_token": "mock_google_access_token_link",
                "id_token": "mock_id_token_jwt_link",
                "expires_in": 3600
            },
            raise_for_status=lambda: None
        )
        mock_verify_token.return_value = {
            "sub": "google_test_id_to_be_linked_456", # New Google ID for this user
            "email": "existing_email@example.com", # Matches existing user's email
            "given_name": "Linked",
            "family_name": "User",
            "picture": "http://example.com/linked_avatar.jpg",
            "email_verified": True
        }

        post_data = {"code": "mock_auth_code_link_user"}
        response = self.client.post(self.callback_url, data=post_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['id'], existing_user_no_google_id.id)
        self.assertEqual(response.data['user']['email'], 'existing_email@example.com')
        
        # Assert that no new user was created
        self.assertEqual(User.objects.count(), 1) 

        # Assert that the existing user's google_id and auth_type were updated
        linked_user = User.objects.get(id=existing_user_no_google_id.id)
        self.assertEqual(linked_user.google_id, "google_test_id_to_be_linked_456")
        self.assertEqual(linked_user.auth_type, "google")
        self.assertGreater(linked_user.last_login, timezone.now() - timezone.timedelta(minutes=1))


    @patch('requests.post')
    @patch('google.oauth2.id_token.verify_oauth2_token')
    def test_google_oauth_callback_invalid_id_token(self, mock_verify_token, mock_requests_post):
        """
        Test case when Google returns an ID token, but it cannot be verified (e.g., invalid signature, expired).
        """
        mock_requests_post.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "access_token": "some_access_token",
                "id_token": "invalid_mock_id_token_jwt", # This token will cause verification to fail
                "expires_in": 3600
            },
            raise_for_status=lambda: None
        )

        # Simulate ID Token verification failure (e.g., ValueError for invalid token)
        mock_verify_token.side_effect = ValueError("Token used too early, or too late.")

        post_data = {"code": "mock_invalid_id_token_code"}
        response = self.client.post(self.callback_url, data=post_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("Invalid or expired Google ID token.", response.data['detail'])
        # Assert that no user was created or modified
        self.assertEqual(User.objects.count(), 0)


    @patch('requests.post')
    def test_google_oauth_callback_google_api_error(self, mock_requests_post):
        """
        Test case when there's an error communicating with Google's token endpoint.
        (e.g., Google returns 4xx or 5xx error, or network issue).
        """
        # Simulate an HTTP error response from Google's token endpoint
        mock_requests_post.return_value = MagicMock(
            status_code=400, # Bad request from Google
            raise_for_status=MagicMock(side_effect=requests.exceptions.HTTPError("400 Client Error: Bad Request for url: ..."))
        )

        post_data = {"code": "mock_error_from_google_code"}
        response = self.client.post(self.callback_url, data=post_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertIn("Failed to communicate with Google authentication service.", response.data['detail'])
        # Assert that no user was created or modified
        self.assertEqual(User.objects.count(), 0)

    
    def test_google_oauth_callback_missing_authorization_code(self):
        """
        Test case when the authorization 'code' is missing from the request.
        """
        post_data = {} # Missing 'code' parameter
        response = self.client.post(self.callback_url, data=post_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Authorization code is required.", response.data['detail'])
        self.assertEqual(User.objects.count(), 0)

    
    @patch('requests.post')
    @patch('google.oauth2.id_token.verify_oauth2_token')
    def test_google_oauth_callback_user_already_exists_with_same_email_different_google_id(self, mock_verify_token, mock_requests_post):
        """
        Test case where a user already exists with the same email but a different
        Google ID (e.g., registered via email, then logs in with Google which has a different internal ID).
        This test expects the existing user to be updated with the new google_id.
        """
        existing_user = User.objects.create_user(
            username="testuser",
            email="existing@example.com",
            password="testpassword123",
            google_id="old_google_id", # Previous Google ID
            auth_type='google'
        )

        mock_requests_post.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "access_token": "token",
                "id_token": "new_mock_id_token",
                "expires_in": 3600
            },
            raise_for_status=lambda: None
        )
        mock_verify_token.return_value = {
            "sub": "new_google_id_from_sso", # New Google ID from SSO
            "email": "existing@example.com", # Same email as existing user
            "given_name": "Test",
            "family_name": "User",
            "picture": "http://example.com/new_avatar.jpg",
            "email_verified": True
        }

        post_data = {"code": "some_auth_code"}
        response = self.client.post(self.callback_url, data=post_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(User.objects.count(), 1) # No new user should be created

        updated_user = User.objects.get(id=existing_user.id)
        self.assertEqual(updated_user.google_id, "new_google_id_from_sso") # google_id should be updated
        self.assertEqual(updated_user.auth_type, 'google')
        self.assertEqual(updated_user.email, "existing@example.com")


    @patch('requests.post')
    @patch('google.oauth2.id_token.verify_oauth2_token')
    def test_google_oauth_callback_missing_email_in_id_token(self, mock_verify_token, mock_requests_post):
        """
        Test case where the ID Token returned by Google is missing the 'email' field.
        """
        mock_requests_post.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "access_token": "token",
                "id_token": "mock_id_token_no_email",
                "expires_in": 3600
            },
            raise_for_status=lambda: None
        )
        # Mock ID token to have sub but no email
        mock_verify_token.return_value = {
            "sub": "google_id_no_email",
            # No 'email' field
            "given_name": "NoEmail",
            "family_name": "User",
        }

        post_data = {"code": "auth_code_no_email"}
        response = self.client.post(self.callback_url, data=post_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Google ID and email are required after verification.", response.data['detail'])
        self.assertEqual(User.objects.count(), 0) # No user should be created