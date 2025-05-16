from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from core.models import Place, Review

User = get_user_model()

class ReviewValidationTest(APITestCase):
    """Test case for the place-type aware review validation."""
    
    def setUp(self):
        """Set up test data."""
        # Create users
        self.user = User.objects.create_user(
            username='user',
            email='user@example.com',
            password='testpassword'
        )
        
        # Create different types of places for testing validation
        self.restaurant = Place.objects.create(
            name='Test Restaurant',
            description='A restaurant for testing',
            type='restaurant',
            price_range='600',
            address='123 Test St',
            district='xinyi',
            user=self.user
        )
        
        self.attraction = Place.objects.create(
            name='Test Attraction',
            description='An attraction for testing',
            type='attraction',
            price_range='600',
            address='456 Test St',
            district='xinyi',
            user=self.user
        )
        
        self.hotel = Place.objects.create(
            name='Test Hotel',
            description='A hotel for testing',
            type='hotel',
            price_range='600',
            address='789 Test St',
            district='xinyi',
            user=self.user
        )
        
        # Set up API client
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_restaurant_review_validation(self):
        """Test that restaurant reviews require food and service ratings."""
        # Missing required fields for a restaurant
        incomplete_review = {
            'overall_rating': 4,
            'comment': 'Great food but service was lacking.'
        }
        
        url = reverse('place-reviews-list', kwargs={'place_pk': self.restaurant.id})
        response = self.client.post(url, incomplete_review, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('food_rating', response.data)
        self.assertIn('service_rating', response.data)
        
        # Complete review with all required fields
        complete_review = {
            'overall_rating': 4,
            'food_rating': 5,
            'service_rating': 3,
            'value_rating': 4,
            'comment': 'Great food but service was lacking.'
        }
        
        response = self.client.post(url, complete_review, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_attraction_review_validation(self):
        """Test that attraction reviews only require overall rating."""
        # Only overall rating is required for attractions
        minimal_review = {
            'overall_rating': 4,
            'comment': 'Great attraction.'
        }
        
        url = reverse('place-reviews-list', kwargs={'place_pk': self.attraction.id})
        response = self.client.post(url, minimal_review, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Missing overall rating
        invalid_review = {
            'comment': 'Great attraction.'
        }
        
        response = self.client.post(url, invalid_review, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('overall_rating', response.data)
    
    def test_review_update_validation(self):
        """Test that updates to reviews also undergo validation."""
        # Create a valid review first
        review = Review.objects.create(
            place=self.restaurant,
            user=self.user,
            overall_rating=4,
            food_rating=4,
            service_rating=4,
            value_rating=4,
            comment='Initial review'
        )
        
        # Try to update with invalid data (removing required fields)
        update_data = {
            'food_rating': None,
            'comment': 'Updated review'
        }
        
        url = reverse('place-reviews-detail', kwargs={'place_pk': self.restaurant.id, 'pk': review.id})
        response = self.client.patch(url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Valid update
        valid_update = {
            'food_rating': 5,
            'comment': 'Updated review'
        }
        
        response = self.client.patch(url, valid_update, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['food_rating'], 5)
        self.assertEqual(response.data['comment'], 'Updated review')
    
    def test_hotel_review_validation(self):
        """Test that hotel reviews require cleanliness rating."""
        # Should pass with overall rating and cleanliness rating
        hotel_review = {
            'overall_rating': 4,
            'cleanliness_rating': 5,
            'comment': 'Very clean hotel with friendly staff.'
        }
        
        url = reverse('place-reviews-list', kwargs={'place_pk': self.hotel.id})
        response = self.client.post(url, hotel_review, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Should fail without cleanliness rating for a hotel
        invalid_hotel_review = {
            'overall_rating': 4,
            'comment': 'Hotel was ok.'
        }
        
        response = self.client.post(url, invalid_hotel_review, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('cleanliness_rating', response.data) 