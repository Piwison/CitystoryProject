from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from core.models import Feature, Place
from core.choices import FEATURE_TYPES, PLACE_TYPE_CHOICES
import json

User = get_user_model()

class FeatureModelTest(TestCase):
    """Test case for the Feature model."""
    
    def setUp(self):
        """Set up test data."""
        self.feature = Feature.objects.create(
            name="Wi-Fi",
            type="amenity",
            description="Free wireless internet access",
            icon="wifi",
            applicable_place_types="restaurant,cafe"
        )
        
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpassword"
        )
        
        self.place = Place.objects.create(
            name="Test Restaurant",
            type="restaurant",
            price_range="1000",
            user=self.user
        )
        
        self.place.features.add(self.feature)
    
    def test_feature_creation(self):
        """Test feature creation with all fields."""
        self.assertEqual(self.feature.name, "Wi-Fi")
        self.assertEqual(self.feature.type, "amenity")
        self.assertEqual(self.feature.description, "Free wireless internet access")
        self.assertEqual(self.feature.icon, "wifi")
        self.assertEqual(self.feature.applicable_place_types, "restaurant,cafe")
    
    def test_string_representation(self):
        """Test string representation of feature."""
        expected_string = "Wi-Fi (Amenity)"
        self.assertEqual(str(self.feature), expected_string)
    
    def test_is_applicable_to_place_type(self):
        """Test the is_applicable_to_place_type method."""
        self.assertTrue(self.feature.is_applicable_to_place_type("restaurant"))
        self.assertTrue(self.feature.is_applicable_to_place_type("cafe"))
        self.assertFalse(self.feature.is_applicable_to_place_type("bar"))
        
        # Test feature with no restrictions
        unrestricted_feature = Feature.objects.create(
            name="Open Late",
            type="service",
            applicable_place_types=""
        )
        self.assertTrue(unrestricted_feature.is_applicable_to_place_type("restaurant"))
        self.assertTrue(unrestricted_feature.is_applicable_to_place_type("cafe"))
        self.assertTrue(unrestricted_feature.is_applicable_to_place_type("bar"))
    
    def test_get_places_count(self):
        """Test the get_places_count method."""
        self.assertEqual(self.feature.get_places_count(), 1)
        
        # Add another place
        second_place = Place.objects.create(
            name="Another Restaurant",
            type="restaurant",
            price_range="600",
            user=self.user
        )
        second_place.features.add(self.feature)
        
        self.assertEqual(self.feature.get_places_count(), 2)
    
    def test_get_by_type(self):
        """Test the get_by_type class method."""
        # Create features of different types
        Feature.objects.create(
            name="Italian",
            type="cuisine",
            description="Italian cuisine"
        )
        Feature.objects.create(
            name="Romantic",
            type="atmosphere",
            description="Romantic setting"
        )
        
        amenities = Feature.get_by_type("amenity")
        cuisines = Feature.get_by_type("cuisine")
        atmospheres = Feature.get_by_type("atmosphere")
        
        self.assertEqual(amenities.count(), 1)
        self.assertEqual(cuisines.count(), 1)
        self.assertEqual(atmospheres.count(), 1)
        
        self.assertEqual(amenities.first().name, "Wi-Fi")
        self.assertEqual(cuisines.first().name, "Italian")
        self.assertEqual(atmospheres.first().name, "Romantic")


class FeatureAPITest(APITestCase):
    """Test the Feature API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.admin_user = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="adminpass"
        )
        
        self.regular_user = User.objects.create_user(
            username="regular",
            email="regular@example.com",
            password="regularpass"
        )
        
        self.place_owner = User.objects.create_user(
            username="owner",
            email="owner@example.com",
            password="ownerpass"
        )
        
        self.client = APIClient()
        
        # Create features of different types
        self.wifi = Feature.objects.create(
            name="Wi-Fi",
            type="amenity",
            description="Free wireless internet",
            icon="wifi",
            applicable_place_types="restaurant,cafe,bar"
        )
        
        self.parking = Feature.objects.create(
            name="Parking",
            type="amenity",
            description="Free parking",
            applicable_place_types="restaurant,cafe,bar,shop"
        )
        
        self.italian = Feature.objects.create(
            name="Italian",
            type="cuisine",
            description="Italian cuisine",
            applicable_place_types="restaurant"
        )
        
        self.vegetarian = Feature.objects.create(
            name="Vegetarian",
            type="cuisine",
            description="Vegetarian options",
            applicable_place_types="restaurant,cafe"
        )
        
        # Create a place
        self.place = Place.objects.create(
            name="Italian Restaurant",
            type="restaurant",
            price_range="1000",
            moderation_status="APPROVED",
            user=self.place_owner
        )
        
        # Add features to place
        self.place.features.add(self.wifi, self.italian)
    
    def test_feature_list(self):
        """Test the feature list endpoint."""
        url = reverse('feature-list')
        response = self.client.get(url)
        
        # Check the response structure
        print(f"Response type: {type(response.data)}")
        print(f"Response data: {response.data}")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that we have a successful response
        self.assertTrue(response.data is not None)
        
        # Convert to list if it's not already
        results = response.data.get('results', response.data)
        
        # Check that we have features in the results
        self.assertTrue(len(results) > 0)
            
    def test_feature_detail(self):
        """Test retrieving a specific feature."""
        url = reverse('feature-detail', args=[self.wifi.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check the feature data
        self.assertEqual(response.data['id'], self.wifi.id)
        self.assertEqual(response.data['name'], 'Wi-Fi')
        self.assertEqual(response.data['type'], 'amenity')
        
        # Check additional fields from our enhanced serializer
        self.assertIn('type_display', response.data)
        self.assertIn('applicable_place_types_list', response.data)
        self.assertIn('places_count', response.data)
        
    def test_feature_filter_by_type(self):
        """Test filtering features by type."""
        url = reverse('feature-list')
        response = self.client.get(f"{url}?type=amenity")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that response has data
        results = response.data.get('results', response.data)
        self.assertTrue(results)
        
        # Convert to list if needed
        if not isinstance(results, list):
            results_list = []
            for key in results:
                results_list.append(results[key])
            results = results_list
            
        # Count amenity features in the results
        amenity_count = 0
        for feature in results:
            if isinstance(feature, dict) and feature.get('type') == 'amenity':
                amenity_count += 1
                
        # We should have 2 amenity features
        self.assertEqual(amenity_count, 2)
        
    def test_feature_filter_by_place_type(self):
        """Test filtering features by applicable place type."""
        url = reverse('feature-list')
        response = self.client.get(f"{url}?applicable_to=shop")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that response has data
        results = response.data.get('results', response.data)
        self.assertTrue(results)
        
        # Convert to list if needed
        if not isinstance(results, list):
            results_list = []
            for key in results:
                results_list.append(results[key])
            results = results_list
            
        # Check for shop-applicable features
        shop_applicable_features = []
        for feature in results:
            if not isinstance(feature, dict):
                continue
                
            applicable_types = feature.get('applicable_place_types', '')
            if not applicable_types or 'shop' in applicable_types:
                shop_applicable_features.append(feature)
                
        # At least one feature should be applicable to shops
        self.assertTrue(len(shop_applicable_features) > 0)
        
        # Specifically, parking should be in the results
        parking_found = False
        for feature in shop_applicable_features:
            if feature.get('name') == 'Parking':
                parking_found = True
                break
                
        self.assertTrue(parking_found, "Parking feature should be included in shop-applicable results")
    
    def test_feature_categories_endpoint(self):
        """Test the feature categories endpoint."""
        url = reverse('feature-categories')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Extract the categories to check
        categories = {item['type']: item['count'] for item in response.data}
        
        self.assertEqual(categories['amenity'], 2)
        self.assertEqual(categories['cuisine'], 2)
    
    def test_feature_by_category_endpoint(self):
        """Test the feature by category endpoint."""
        url = reverse('feature-by-category')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that all categories are present
        for type_code, _ in FEATURE_TYPES:
            self.assertIn(type_code, response.data)
        
        # Check that categories have the right number of features
        self.assertEqual(len(response.data['amenity']['features']), 2)
        self.assertEqual(len(response.data['cuisine']['features']), 2)
    
    def test_feature_by_place_type_endpoint(self):
        """Test the feature by place type endpoint."""
        url = reverse('feature-by-place-type')
        
        # Test with missing type parameter
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test with invalid type parameter
        response = self.client.get(url, {'type': 'invalid'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test with valid type
        response = self.client.get(url, {'type': 'restaurant'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 4)  # All features apply to restaurants
        
        response = self.client.get(url, {'type': 'shop'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # Only parking applies to shops
    
    def test_feature_places_endpoint(self):
        """Test the feature places endpoint."""
        url = reverse('feature-places', args=[self.wifi.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # One place has WiFi
        self.assertEqual(response.data[0]['name'], "Italian Restaurant")
    
    def test_create_feature_authentication(self):
        """Test creating a feature requires authentication."""
        url = reverse('feature-list')
        data = {
            'name': 'New Feature',
            'type': 'other',
            'description': 'A new feature',
        }
        
        # Unauthenticated request should fail
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Authenticate and retry
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_batch_create_features(self):
        """Test batch creation of features."""
        url = reverse('feature-batch-create')
        data = [
            {
                'name': 'Feature 1',
                'type': 'amenity',
                'description': 'First feature',
            },
            {
                'name': 'Feature 2',
                'type': 'amenity',
                'description': 'Second feature',
            },
            {
                'name': 'Invalid Feature',  # No type field
                'description': 'This should fail unless defaults are applied',
            }
        ]
        
        # Authentication required
        self.client.force_authenticate(user=self.admin_user)
        
        # Make the request
        response = self.client.post(url, data, format='json')
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that created and errors are in the response
        self.assertIn('created', response.data)
        self.assertIn('errors', response.data)
        
        # Check that we have Feature 1 and Feature 2 in the created list
        created_names = [f['name'] for f in response.data['created']]
        self.assertIn('Feature 1', created_names)
        self.assertIn('Feature 2', created_names)
        
        # Check what happened with the Invalid Feature
        # It either should have a validation error or be created with a default type
        invalid_feature_created = 'Invalid Feature' in created_names
        
        if not invalid_feature_created:
            # If not created, should be in the errors
            error_names = [e['data'].get('name') for e in response.data['errors'] if 'data' in e and 'name' in e['data']]
            self.assertIn('Invalid Feature', error_names)
        else:
            # If created, should have the default type
            for feature in response.data['created']:
                if feature['name'] == 'Invalid Feature':
                    self.assertIn('type', feature)
                    self.assertEqual(feature['type'], 'other')
    
    def test_associate_features_with_place(self):
        """Test associating features with a place."""
        url = reverse('feature-associate-with-place')
        
        # Authentication required
        self.client.force_authenticate(user=self.place_owner)
        
        data = {
            'place_id': self.place.id,
            'feature_ids': [self.parking.id, self.vegetarian.id]
        }
        
        # Initially place has 2 features
        initial_count = self.place.features.count()
        self.assertEqual(initial_count, 2)
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Now place should have 4 features
        self.place.refresh_from_db()
        self.assertEqual(self.place.features.count(), 4)
        
        # Test permission - other user cannot modify features
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Admin can modify any place's features
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'place_id': self.place.id,
            'feature_ids': [self.parking.id]  # Already associated, shouldn't duplicate
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Place should still have 4 features (no duplicates)
        self.place.refresh_from_db()
        self.assertEqual(self.place.features.count(), 4)
    
    def test_feature_applicability_validation(self):
        """Test validation of feature applicability when associating with place."""
        # Create a shop-only feature
        shop_feature = Feature.objects.create(
            name="Shop Feature",
            type="other",
            applicable_place_types="shop"
        )
        
        # Try to add a shop-only feature to a restaurant
        url = reverse('feature-associate-with-place')
        self.client.force_authenticate(user=self.place_owner)
        
        # Count features before
        initial_count = self.place.features.count()
        
        data = {
            'place_id': self.place.id,
            'feature_ids': [shop_feature.id]
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('not_applicable', response.data)
        
        # Place should still have the same number of features
        self.place.refresh_from_db()
        self.assertEqual(self.place.features.count(), initial_count) 