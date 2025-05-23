from django.test import TestCase
from django.contrib.auth import get_user_model
from core.models import Place, Feature
from core.serializers import PlaceSerializer

User = get_user_model()

class PlaceSerializerTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='serializer_test_user',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create features for different place types
        self.restaurant_feature = Feature.objects.create(
            name='Outdoor Seating',
            icon='outdoor_seating',
            feature_type='amenity'
        )
        
        self.hotel_feature = Feature.objects.create(
            name='Room Service',
            icon='room_service',
            feature_type='service'
        )

    def test_validate_feature_ids_success(self):
        """Test that features are correctly associated with a place."""
        data = {
            'name': 'Test Restaurant',
            'address': '123 Test St',
            'placeType': 'restaurant',
            'priceLevel': 2,
            'featureIds': [self.restaurant_feature.id],
            'createdBy': self.user.id
        }
        
        serializer = PlaceSerializer(data=data)
        self.assertTrue(serializer.is_valid(), f"Serializer errors: {serializer.errors}")
        place = serializer.save()
        saved_feature_ids = [str(f.id) for f in place.features.all()]
        self.assertIn(str(self.restaurant_feature.id), saved_feature_ids)

    def test_all_features_applicable_to_all_place_types(self):
        """Test that all features are now applicable to all place types."""
        data = {
            'name': 'Test Restaurant',
            'address': '123 Test St',
            'placeType': 'restaurant',
            'priceLevel': 2,
            'featureIds': [self.hotel_feature.id],  # Hotel feature should now be valid for restaurant
            'createdBy': self.user.id
        }
        
        serializer = PlaceSerializer(data=data)
        self.assertTrue(serializer.is_valid(), f"Serializer errors: {serializer.errors}")
        place = serializer.save()
        saved_feature_ids = [str(f.id) for f in place.features.all()]
        self.assertIn(str(self.hotel_feature.id), saved_feature_ids)

    def test_validate_feature_ids_update(self):
        """Test feature validation during place update."""
        # Create initial place
        place = Place.objects.create(
            name='Test Restaurant',
            address='123 Test St',
            place_type='restaurant',
            price_level=2,
            created_by=self.user
        )
        place.features.add(self.restaurant_feature)
        
        # Update with hotel feature (should be valid now)
        data = {
            'featureIds': [self.hotel_feature.id]
        }
        
        serializer = PlaceSerializer(place, data=data, partial=True)
        self.assertTrue(serializer.is_valid(), f"Serializer errors: {serializer.errors}")
        updated_place = serializer.save()
        updated_feature_ids = [str(f.id) for f in updated_place.features.all()]
        self.assertIn(str(self.hotel_feature.id), updated_feature_ids)
        # Ensure the old feature is gone if not included in the update
        self.assertNotIn(str(self.restaurant_feature.id), updated_feature_ids)

    def test_create_place(self):
        place = Place.objects.create(
            name='Test Place',
            address='123 Test St',
            place_type='restaurant',
            price_level=2,
            created_by=self.user
        )
        self.assertEqual(place.name, 'Test Place')
        self.assertEqual(place.price_level, 2)
        self.assertEqual(place.created_by, self.user) 

    def test_no_features_provided_create(self):
        """Test place creation when no feature_ids are provided."""
        data = {
            'name': 'Test Place',
            'address': '123 Test St',
            'placeType': 'restaurant',
            'priceLevel': 2,
            'createdBy': self.user.id
        }
        
        serializer = PlaceSerializer(data=data)
        self.assertTrue(serializer.is_valid(), f"Serializer errors: {serializer.errors}")
        place = serializer.save()
        self.assertEqual(place.name, 'Test Place')
        self.assertEqual(place.price_level, 2)
        self.assertEqual(place.created_by, self.user)
        self.assertEqual(place.features.count(), 0) 