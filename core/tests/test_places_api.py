from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from core.models import Place, Feature

User = get_user_model()

class PlaceAPICreateUpdateDetailTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        # Create some features
        self.feature1 = Feature.objects.create(name="Wi-Fi", icon="wifi")
        self.feature2 = Feature.objects.create(name="Pet Friendly", icon="paw")
    
    def test_create_place_with_features_and_optional_fields(self):
        """Test creating a place with features and all optional fields."""
        url = reverse('place-list')
        payload = {
            "name": "Test Place",
            "description": "A great place to test.",
            "placeType": "restaurant",
            "priceLevel": 400,
            "address": "123 Test St",
            "city": "Taipei",
            "state": "TW",
            "zipCode": "100",
            "latitude": 25.033,
            "longitude": 121.5654,
            "featureIds": [self.feature1.id, self.feature2.id],
            "website": "https://test.com",
            "phone": "123456789",
            "createdBy": self.user.id
        }
        response = self.client.post(url, payload, format='json')
        print(response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.data
        self.assertEqual(data['name'], payload['name'])
        self.assertEqual(data['placeType'], payload['placeType'])
        self.assertEqual(data['priceLevel'], payload['priceLevel'])
        self.assertEqual(len(data['features']), 2)
        feature_names = [f['name'] for f in data['features']]
        self.assertIn("Wi-Fi", feature_names)
        self.assertIn("Pet Friendly", feature_names)
        self.assertEqual(data['website'], payload['website'])
        self.assertEqual(data['phone'], payload['phone'])
        # Optional fields present
        self.assertEqual(float(data['latitude']), payload['latitude'])
        self.assertEqual(float(data['longitude']), payload['longitude'])

    def test_create_place_with_minimal_fields(self):
        """Test creating a place with only required fields and omitting all optional fields."""
        url = reverse('place-list')
        payload = {
            "name": "Minimal Place",
            "description": "Just the basics.",
            "placeType": "cafe",
            "priceLevel": 200,
            "address": "456 Minimal Ave",
            "createdBy": self.user.id
        }
        response = self.client.post(url, payload, format='json')
        print(response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.data
        self.assertEqual(data['name'], payload['name'])
        self.assertEqual(data['placeType'], payload['placeType'])
        self.assertEqual(data['priceLevel'], payload['priceLevel'])
        # Optional fields should be null or default
        self.assertIsNone(data.get('website'))
        self.assertIsNone(data.get('phone'))
        self.assertIsNone(data.get('city'))
        self.assertIsNone(data.get('state'))
        self.assertIsNone(data.get('zipCode'))
        self.assertIsNone(data.get('latitude'))
        self.assertIsNone(data.get('longitude'))
        self.assertEqual(data['features'], [])

    def test_update_place_features(self):
        """Test updating a place's features."""
        # Create a place first
        place = Place.objects.create(
            name="Update Place",
            description="To be updated.",
            place_type="bar",
            price_level=600,
            address="789 Update Rd",
            created_by=self.user
        )
        url = reverse('place-detail', args=[place.id])
        # Add only one feature
        payload = {
            "featureIds": [self.feature1.id]
        }
        response = self.client.patch(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(len(data['features']), 1)
        self.assertEqual(data['features'][0]['name'], "Wi-Fi")
        # Now update to both features
        payload = {
            "featureIds": [self.feature1.id, self.feature2.id]
        }
        response = self.client.patch(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(len(data['features']), 2)
        feature_names = [f['name'] for f in data['features']]
        self.assertIn("Wi-Fi", feature_names)
        self.assertIn("Pet Friendly", feature_names)

    def test_update_place_remove_all_features(self):
        """Test updating a place to remove all features."""
        place = Place.objects.create(
            name="No Features Place",
            description="Will remove features.",
            place_type="cafe",
            price_level=200,
            address="101 Remove St",
            created_by=self.user
        )
        place.features.add(self.feature1, self.feature2)
        url = reverse('place-detail', args=[place.id])
        payload = {
            "featureIds": []
        }
        response = self.client.patch(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data['features'], [])

    def test_place_detail_includes_features(self):
        """Test that place detail includes full feature objects."""
        place = Place.objects.create(
            name="Detail Place",
            description="Check features in detail.",
            place_type="restaurant",
            price_level=400,
            address="202 Detail Ave",
            created_by=self.user
        )
        place.features.add(self.feature1, self.feature2)
        url = reverse('place-detail', args=[place.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(len(data['features']), 2)
        feature_names = [f['name'] for f in data['features']]
        self.assertIn("Wi-Fi", feature_names)
        self.assertIn("Pet Friendly", feature_names)

    def test_place_creation_and_retrieval(self):
        """Test creating and retrieving places."""
        self.place1 = Place.objects.create(
            name='Test Place',
            description='A great place to test.',
            place_type='bar',
            price_level=600,
            address='123 Test St',
            created_by=self.user
        )
        self.place2 = Place.objects.create(
            name='Minimal Place',
            description='Just the basics.',
            place_type='cafe',
            price_level=200,
            address='456 Minimal Ave',
            created_by=self.user
        )
        self.place3 = Place.objects.create(
            name='Another Place',
            description='Another test place.',
            place_type='restaurant',
            price_level=400,
            address='789 Another St',
            created_by=self.user
        )

        response = self.client.get(reverse('place-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(len(data['results']), 3)
        
        result_names = [p['name'] for p in data['results']]
        self.assertIn('Test Place', result_names)
        self.assertIn('Minimal Place', result_names)
        self.assertIn('Another Place', result_names)
        # self.assertEqual(data['results'][0]['name'], 'Test Place') # Old assertion
        # self.assertEqual(data['results'][1]['name'], 'Minimal Place') # Old assertion
        # self.assertEqual(data['results'][2]['name'], 'Another Place') # Old assertion 