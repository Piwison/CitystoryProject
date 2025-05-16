from django.test import TestCase
from django.contrib.auth import get_user_model
from core.models import Place, Feature
from core.serializers import PlaceSerializer

User = get_user_model()

class PlaceSerializerTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        
        # Create features for different place types
        self.restaurant_feature = Feature.objects.create(
            name='Outdoor Seating',
            description='Has outdoor seating area',
            icon='outdoor_seating',
            type='amenity',
            applicable_place_types=['restaurant', 'cafe']
        )
        
        self.hotel_feature = Feature.objects.create(
            name='Room Service',
            description='24/7 room service available',
            icon='room_service',
            type='service',
            applicable_place_types=['hotel']
        )

    def test_validate_feature_ids_success(self):
        """Test that valid features for a place type are accepted."""
        data = {
            'name': 'Test Restaurant',
            'address': '123 Test St',
            'type': 'restaurant',
            'price_range': 2,
            'feature_ids': [self.restaurant_feature.id],
            'owner': self.user.id
        }
        
        serializer = PlaceSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['feature_ids'], [self.restaurant_feature])

    def test_validate_feature_ids_invalid(self):
        """Test that invalid features for a place type are rejected."""
        data = {
            'name': 'Test Restaurant',
            'address': '123 Test St',
            'type': 'restaurant',
            'price_range': 2,
            'feature_ids': [self.hotel_feature.id],  # Hotel feature not valid for restaurant
            'owner': self.user.id
        }
        
        serializer = PlaceSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('feature_ids', serializer.errors)
        self.assertIn(
            f'The following features are not applicable to restaurant: Room Service (Service)',
            str(serializer.errors['feature_ids'])
        )

    def test_validate_feature_ids_update(self):
        """Test feature validation during place update."""
        # Create initial place
        place = Place.objects.create(
            name='Test Restaurant',
            address='123 Test St',
            type='restaurant',
            price_range=2,
            owner=self.user
        )
        place.features.add(self.restaurant_feature)
        
        # Try to update with invalid feature
        data = {
            'feature_ids': [self.hotel_feature.id]  # Hotel feature not valid for restaurant
        }
        
        serializer = PlaceSerializer(place, data=data, partial=True)
        self.assertFalse(serializer.is_valid())
        self.assertIn('feature_ids', serializer.errors)
        self.assertIn(
            f'The following features are not applicable to restaurant: Room Service (Service)',
            str(serializer.errors['feature_ids'])
        ) 