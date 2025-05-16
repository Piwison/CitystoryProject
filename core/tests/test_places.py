import json
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from ..models import Place, Feature
from ..choices import DISTRICT_CHOICES

User = get_user_model()

class PlaceFilteringTestCase(APITestCase):
    """Test the filtering capabilities of the Places API"""
    
    def setUp(self):
        """Set up test data"""
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword'
        )
        
        # Create places in different districts
        self.place1 = Place.objects.create(
            name='Test Restaurant Xinyi',
            description='A restaurant in Xinyi',
            address='123 Xinyi Road',
            district='xinyi',
            type='restaurant',
            price_range='400',
            moderation_status='approved',
            user=self.user
        )
        
        self.place2 = Place.objects.create(
            name='Test Cafe Daan',
            description='A cafe in Daan',
            address='456 Daan Road',
            district='daan',
            type='cafe',
            price_range='200',
            moderation_status='approved',
            user=self.user
        )
        
        self.place3 = Place.objects.create(
            name='Test Bar Zhongshan',
            description='A bar in Zhongshan',
            address='789 Zhongshan Road',
            district='zhongshan',
            type='bar',
            price_range='600',
            moderation_status='approved',
            user=self.user
        )
        
        # Create a place in draft state
        self.place4 = Place.objects.create(
            name='Draft Place',
            description='This is in draft state',
            address='999 Draft Road',
            district='nangang',
            type='restaurant',
            price_range='400',
            moderation_status='pending',
            draft=True,
            user=self.user
        )
        
        # API client
        self.client = APIClient()
    
    def test_district_filter(self):
        """Test filtering places by district"""
        url = reverse('place-list')
        response = self.client.get(f"{url}?districts=xinyi")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Test Restaurant Xinyi')
    
    def test_multiple_district_filter(self):
        """Test filtering places by multiple districts"""
        url = reverse('place-list')
        response = self.client.get(f"{url}?districts=xinyi,daan")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        
        # Check that both districts are represented in the results
        districts = [place['district'] for place in response.data['results']]
        self.assertIn('xinyi', districts)
        self.assertIn('daan', districts)
    
    def test_district_endpoint(self):
        """Test the /districts/ endpoint that returns all districts with counts"""
        url = reverse('place-districts')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check the response format
        self.assertTrue(isinstance(response.data, list))
        self.assertTrue(len(response.data) > 0)
        
        # Check that each district has the expected fields
        for district in response.data:
            self.assertIn('name', district)
            self.assertIn('value', district)
            self.assertIn('count', district)
        
        # Verify the counts for some districts
        for district in response.data:
            if district['value'] == 'xinyi':
                self.assertEqual(district['count'], 1)
            elif district['value'] == 'daan':
                self.assertEqual(district['count'], 1)
            elif district['value'] == 'zhongshan':
                self.assertEqual(district['count'], 1)
    
    def test_combined_search_with_districts(self):
        """Test the combined search endpoint with district filtering"""
        url = reverse('combined-search')
        response = self.client.get(f"{url}?district=xinyi,daan")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)
        
        # Check that both districts are represented in the results
        districts = [place['district'] for place in response.data['results']]
        self.assertIn('xinyi', districts)
        self.assertIn('daan', districts) 