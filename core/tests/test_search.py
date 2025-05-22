import json
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from ..models import Place, Feature
from ..choices import DISTRICT_CHOICES

User = get_user_model()

class SearchAPITestCase(APITestCase):
    """Test the search API functionality"""
    
    def setUp(self):
        """Set up test data"""
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword'
        )
        
        # Create test places with searchable content
        self.place1 = Place.objects.create(
            name='Coffee House Tokyo',
            description='A great coffee place with excellent pastries and atmosphere',
            address='123 Coffee Street, Xinyi District',
            district='xinyi',
            place_type='cafe',
            price_level='400',
            moderation_status='approved',
            user=self.user
        )
        
        self.place2 = Place.objects.create(
            name='Ramen Shop',
            description='Authentic Japanese ramen with homemade noodles',
            address='456 Noodle Road, Daan District',
            district='daan',
            place_type='restaurant',
            price_level='600',
            moderation_status='approved',
            user=self.user
        )
        
        self.place3 = Place.objects.create(
            name='Craft Beer Bar',
            description='Local and imported craft beers with snacks',
            address='789 Beer Avenue, Zhongshan District',
            district='zhongshan',
            place_type='bar',
            price_level='800',
            moderation_status='approved',
            user=self.user
        )
        
        # Create a place in draft/pending state (shouldn't appear in search results)
        self.place4 = Place.objects.create(
            name='Secret Speakeasy',
            description='Hidden cocktail bar with jazz music',
            address='999 Secret Lane, Xinyi District',
            district='xinyi',
            place_type='bar',
            price_level='1000',
            moderation_status='pending',
            draft=True,
            user=self.user
        )
        
        # Create a place with Japanese content to test multilingual search
        self.place5 = Place.objects.create(
            name='寿司レストラン',
            description='本格的な日本の寿司',
            address='123 Sushi Road, Daan District',
            district='daan',
            place_type='restaurant',
            price_level='1000',
            moderation_status='approved',
            user=self.user
        )
        
        # API client
        self.client = APIClient()
    
    def test_basic_search(self):
        """Test basic search functionality"""
        url = reverse('full-text-search')
        response = self.client.get(f"{url}?q=coffee")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['name'], 'Coffee House Tokyo')
    
    def test_multilingual_search(self):
        """Test search with non-English content"""
        url = reverse('full-text-search')
        response = self.client.get(f"{url}?q=寿司")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['name'], '寿司レストラン')
    
    def test_fuzzy_search(self):
        """Test fuzzy search with typos"""
        url = reverse('full-text-search')
        # Misspell "coffee" as "cofee"
        response = self.client.get(f"{url}?q=cofee&fuzzy=true")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data['results']) > 0)
        self.assertEqual(response.data['results'][0]['name'], 'Coffee House Tokyo')
    
    def test_highlighting(self):
        """Test search result highlighting"""
        url = reverse('full-text-search')
        response = self.client.get(f"{url}?q=coffee&highlight=true")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        
        # Check that highlights are included and contain the search term
        result = response.data['results'][0]
        self.assertIn('highlights', result)
        
        # At least one field should have highlights
        has_highlights = any('<mark>' in value for value in result['highlights'].values())
        self.assertTrue(has_highlights)
    
    def test_search_filtering(self):
        """Test search with filters"""
        url = reverse('full-text-search')
        # Search for places with "craft" in any field, limit to 'bar' type
        response = self.client.get(f"{url}?q=craft&type=bar")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['name'], 'Craft Beer Bar')
    
    def test_combined_search(self):
        """Test the combined search endpoint"""
        url = reverse('combined-search')
        # Search for food-related places in Daan district
        response = self.client.get(f"{url}?q=food&district=daan")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # All results should be in Daan district
        for result in response.data['results']:
            self.assertEqual(result['district'], 'daan')
    
    def test_pagination(self):
        """Test search result pagination"""
        # Create more places to test pagination
        for i in range(25):
            Place.objects.create(
                name=f'Test Place {i}',
                description='A test place description',
                address=f'{i} Test Street, Xinyi District',
                district='xinyi',
                place_type='cafe',
                price_level='400',
                moderation_status='approved',
                user=self.user
            )
        
        url = reverse('full-text-search')
        response = self.client.get(f"{url}?q=test&page_size=10&page=2")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 10)  # Page size should be respected
        self.assertIsNotNone(response.data.get('next'))  # Should have next page
        self.assertIsNotNone(response.data.get('previous'))  # Should have previous page
    
    def test_advanced_search_syntax(self):
        """Test advanced search syntax with quotes and negation"""
        url = reverse('full-text-search')
        
        # Exact phrase search with quotes
        response = self.client.get(f"{url}?q=\"craft beers\"")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['name'], 'Craft Beer Bar')
        
        # Negation with minus
        response = self.client.get(f"{url}?q=bar -craft")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should not find "Craft Beer Bar" since we negated "craft"
        for result in response.data['results']:
            self.assertNotEqual(result['name'], 'Craft Beer Bar')
    
    def test_search_without_query(self):
        """Test search without a query parameter"""
        url = reverse('full-text-search')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_combined_search_without_query(self):
        """Test combined search without a query but with filters"""
        url = reverse('combined-search')
        response = self.client.get(f"{url}?district=xinyi")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return all places in Xinyi district
        for result in response.data['results']:
            self.assertEqual(result['district'], 'xinyi') 