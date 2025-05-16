from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from core.models import Place, Review, Photo, Notification

User = get_user_model()

class ModerationPermissionsTestCase(APITestCase):
    def setUp(self):
        # Create users
        self.user = User.objects.create_user(
            username='testuser',
            email='user@test.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.moderator = User.objects.create_user(
            username='moduser',
            email='moderator@test.com',
            password='modpass123',
            first_name='Mod',
            last_name='User',
            is_staff=True
        )
        self.moderator.groups.create(name='moderators')

    def test_moderator_permissions(self):
        """Test that only moderators can access moderation endpoints"""
        # Try accessing without authentication
        response = self.client.get('/api/moderation/places/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Try accessing as regular user
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/moderation/places/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Try accessing as moderator
        self.client.force_authenticate(user=self.moderator)
        response = self.client.get('/api/moderation/places/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check other moderation endpoints
        self.client.force_authenticate(user=self.moderator)
        response = self.client.get('/api/moderation/reviews/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.client.force_authenticate(user=self.moderator)
        response = self.client.get('/api/moderation/photos/')
        self.assertEqual(response.status_code, status.HTTP_200_OK) 