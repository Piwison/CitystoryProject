"""
Tests for the geocoding API endpoints.
"""
from django.test import TestCase
from rest_framework.test import APIClient
from django.urls import reverse
from django.contrib.auth import get_user_model
from unittest.mock import patch
from core.models import Place

User = get_user_model()

class GeocodingAPITest(TestCase):
    """Test suite for geocoding API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        # Create test users
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.admin_user = User.objects.create_user(
            username='adminuser',
            email='admin@example.com',
            password='adminpass123',
            is_staff=True
        )
        
        # Create test places
        self.place = Place.objects.create(
            name="Test Place",
            description="A test place",
            type="restaurant",
            price_range="600",
            address="101 Taipei 101, Xinyi District, Taipei, Taiwan",
            user=self.user
        )
        
        self.place_without_address = Place.objects.create(
            name="Place Without Address",
            description="A test place without address",
            type="cafe",
            price_range="400",
            user=self.user
        )
        
        # Create places for batch geocoding
        for i in range(5):
            Place.objects.create(
                name=f"Batch Place {i}",
                description=f"A batch place {i}",
                type="restaurant",
                price_range="600",
                address=f"Address {i}, Taipei, Taiwan",
                user=self.user
            )
        
        # Set up API client
        self.client = APIClient()
    
    @patch('core.utils.geocoding.geocode_address')
    @patch('core.utils.geocoding.determine_district')
    def test_geocode_place_endpoint(self, mock_determine_district, mock_geocode_address):
        """Test the place geocoding endpoint."""
        # Mock the geocoding response
        mock_geocode_address.return_value = (25.0339639, 121.5644722)
        mock_determine_district.return_value = 'xinyi'
        
        # Authenticate
        self.client.force_authenticate(user=self.user)
        
        # Make the request using DRF's default URL pattern for actions
        url = f'/api/places/{self.place.pk}/geocode/'
        response = self.client.post(url, format='json')
        
        # Check response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['latitude'], 25.0339639)
        self.assertEqual(response.data['longitude'], 121.5644722)
        self.assertEqual(response.data['district'], 'xinyi')
        
        # Verify the place was updated
        self.place.refresh_from_db()
        self.assertEqual(float(self.place.latitude), 25.0339639)
        self.assertEqual(float(self.place.longitude), 121.5644722)
        self.assertEqual(self.place.district, 'xinyi')
        
        # Verify the geocoding function was called correctly
        mock_geocode_address.assert_called_once_with(self.place.address)
        mock_determine_district.assert_called_once_with(25.0339639, 121.5644722)
    
    def test_geocode_place_without_address(self):
        """Test geocoding a place without an address."""
        # Authenticate
        self.client.force_authenticate(user=self.user)
        
        # Make the request
        url = f'/api/places/{self.place_without_address.pk}/geocode/'
        response = self.client.post(url, format='json')
        
        # Check response
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['detail'], "Place has no address to geocode.")
    
    @patch('core.utils.geocoding.geocode_address')
    def test_geocode_place_geocoding_failure(self, mock_geocode_address):
        """Test handling geocoding failures."""
        # Mock the geocoding response to simulate failure
        mock_geocode_address.return_value = None
        
        # Authenticate
        self.client.force_authenticate(user=self.user)
        
        # Make the request
        url = f'/api/places/{self.place.pk}/geocode/'
        response = self.client.post(url, format='json')
        
        # Check response
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['detail'], "Geocoding failed for this address.")
    
    def test_geocode_place_unauthorized(self):
        """Test that unauthorized users cannot geocode places."""
        # Don't authenticate
        
        # Make the request
        url = f'/api/places/{self.place.pk}/geocode/'
        response = self.client.post(url, format='json')
        
        # Check response (should be unauthorized)
        self.assertEqual(response.status_code, 401)
    
    def test_geocode_place_not_owner(self):
        """Test that non-owners cannot geocode places they don't own."""
        # Create a different user
        different_user = User.objects.create_user(
            username='differentuser',
            email='different@example.com',
            password='differentpass123'
        )
        
        # Authenticate as the different user
        self.client.force_authenticate(user=different_user)
        
        # Make the request
        url = f'/api/places/{self.place.pk}/geocode/'
        response = self.client.post(url, format='json')
        
        # Check response (should be forbidden)
        self.assertEqual(response.status_code, 403)
    
    @patch('core.utils.geocoding.batch_geocode_places')
    def test_batch_geocode_endpoint(self, mock_batch_geocode):
        """Test the batch geocoding endpoint."""
        # Mock the batch geocoding response
        mock_batch_geocode.return_value = (3, 2)
        
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Make the request
        url = '/api/places/batch_geocode/'
        response = self.client.post(url, format='json')
        
        # Check response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['success_count'], 3)
        self.assertEqual(response.data['failure_count'], 2)
        self.assertEqual(response.data['total_processed'], 5)
        
        # Verify batch_geocode was called
        mock_batch_geocode.assert_called_once()
    
    def test_batch_geocode_non_admin(self):
        """Test that non-admin users cannot access batch geocoding."""
        # Authenticate as regular user
        self.client.force_authenticate(user=self.user)
        
        # Make the request
        url = '/api/places/batch_geocode/'
        response = self.client.post(url, format='json')
        
        # Check response (should be forbidden)
        self.assertEqual(response.status_code, 403) 