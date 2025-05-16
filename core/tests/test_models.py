from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from core.models import User, Place, Feature

class PlaceModelTest(TestCase):
    def setUp(self):
        # Create a test user
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        
        # Create a test place
        self.place = Place.objects.create(
            name='Test Cafe',
            address='123 Test St',
            type='cafe',
            price_range=2,
            google_maps_link='https://maps.google.com/test',
            owner=self.user
        )

    def test_place_creation(self):
        """Test that a place can be created with all required fields"""
        self.assertEqual(self.place.name, 'Test Cafe')
        self.assertEqual(self.place.address, '123 Test St')
        self.assertEqual(self.place.type, 'cafe')
        self.assertEqual(self.place.price_range, 2)
        self.assertEqual(self.place.google_maps_link, 'https://maps.google.com/test')
        self.assertEqual(self.place.owner, self.user)
        self.assertTrue(self.place.draft)

    def test_string_representation(self):
        """Test the string representation of a place"""
        self.assertEqual(str(self.place), 'Test Cafe (Cafe)')

    def test_price_display(self):
        """Test the price_display property"""
        self.assertEqual(self.place.price_display, '$$')
        self.place.price_range = 4
        self.place.save()
        self.assertEqual(self.place.price_display, '$$$$')

    def test_publish_unpublish(self):
        """Test publishing and unpublishing a place"""
        self.assertTrue(self.place.draft)
        self.assertFalse(self.place.is_published)
        
        self.place.publish()
        self.assertFalse(self.place.draft)
        self.assertTrue(self.place.is_published)
        
        self.place.unpublish()
        self.assertTrue(self.place.draft)
        self.assertFalse(self.place.is_published)

    def test_attraction_price_range_validation(self):
        """Test that attractions cannot have a price range higher than $$$"""
        with self.assertRaises(ValidationError):
            Place.objects.create(
                name='Test Attraction',
                address='456 Test St',
                type='attraction',
                price_range=4,  # This should fail
                owner=self.user
            )

    def test_feature_management(self):
        """Test adding and removing features"""
        feature = Feature.objects.create(
            name='WiFi',
            type='amenity',
            description='Free WiFi'
        )
        
        # Test adding feature
        self.place.add_feature(feature)
        self.assertIn(feature, self.place.features.all())
        
        # Test getting features by type
        amenity_features = self.place.get_features_by_type('amenity')
        self.assertIn(feature, amenity_features)
        
        # Test removing feature
        self.place.remove_feature(feature)
        self.assertNotIn(feature, self.place.features.all())

class FeatureModelTest(TestCase):
    def setUp(self):
        self.feature = Feature.objects.create(
            name="WiFi",
            type="amenity",
            description="Free wireless internet access"
        )

    def test_feature_creation(self):
        """Test that a feature can be created with all fields"""
        self.assertEqual(self.feature.name, "Wifi")
        self.assertEqual(self.feature.type, "amenity")
        self.assertEqual(self.feature.description, "Free wireless internet access")
        self.assertIsNotNone(self.feature.created_at)
        self.assertIsNotNone(self.feature.updated_at)

    def test_feature_str_representation(self):
        """Test the string representation of a feature"""
        self.assertEqual(str(self.feature), "Wifi (Amenity)")

    def test_feature_display_name(self):
        """Test the display_name property"""
        self.assertEqual(self.feature.display_name, "Wifi (Amenity)")

    def test_unique_name_type_constraint(self):
        """Test that features must have unique name-type combinations"""
        with self.assertRaises(IntegrityError):
            Feature.objects.create(
                name="WiFi",
                type="amenity",
                description="Duplicate feature"
            )

    def test_get_by_type(self):
        """Test getting features by type"""
        Feature.objects.create(
            name="Parking",
            type="amenity",
            description="Free parking"
        )
        Feature.objects.create(
            name="Italian",
            type="cuisine",
            description="Italian cuisine"
        )
        
        amenities = Feature.get_by_type("amenity")
        self.assertEqual(amenities.count(), 2)
        self.assertIn(self.feature, amenities)

    def test_get_types(self):
        """Test getting all feature types"""
        types = Feature.get_types()
        self.assertIn("amenity", types)
        self.assertIn("cuisine", types)
        self.assertIn("atmosphere", types)
        self.assertEqual(len(types), 5)  # Total number of defined types

    def test_name_normalization(self):
        """Test that feature names are properly normalized"""
        feature = Feature.objects.create(
            name="outdoor seating",
            type="amenity"
        )
        self.assertEqual(feature.name, "Outdoor Seating")

    def test_get_places_count(self):
        """Test counting associated places"""
        user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123"
        )
        place = Place.objects.create(
            name="Test Place",
            address="123 Test St",
            type="restaurant",
            price_range=2,
            owner=user
        )
        place.features.add(self.feature)
        
        self.assertEqual(self.feature.get_places_count(), 1) 