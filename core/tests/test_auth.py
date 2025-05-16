from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from rest_framework import status

User = get_user_model()

class JWTAuthenticationTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.token_obtain_url = reverse('token_obtain_pair')
        self.token_refresh_url = reverse('token_refresh')
        self.token_verify_url = reverse('token_verify')

    def test_obtain_token_pair(self):
        """Test obtaining JWT token pair"""
        response = self.client.post(self.token_obtain_url, {
            'email': 'test@example.com',
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_refresh_token(self):
        """Test refreshing JWT token"""
        # First obtain tokens
        response = self.client.post(self.token_obtain_url, {
            'email': 'test@example.com',
            'password': 'testpass123'
        })
        refresh_token = response.data['refresh']

        # Then try to refresh the access token
        response = self.client.post(self.token_refresh_url, {
            'refresh': refresh_token
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_verify_token(self):
        """Test verifying JWT token"""
        # First obtain tokens
        response = self.client.post(self.token_obtain_url, {
            'email': 'test@example.com',
            'password': 'testpass123'
        })
        access_token = response.data['access']

        # Then verify the access token
        response = self.client.post(self.token_verify_url, {
            'token': access_token
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_obtain_token_invalid_credentials(self):
        """Test obtaining JWT token with invalid credentials"""
        response = self.client.post(self.token_obtain_url, {
            'email': 'test@example.com',
            'password': 'wrongpass'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_verify_invalid_token(self):
        """Test verifying invalid JWT token"""
        response = self.client.post(self.token_verify_url, {
            'token': 'invalid.token.here'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED) 