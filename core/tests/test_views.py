from django.urls import reverse
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType # Ensure this is imported
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from core.models import Place, Review, Notification, Feature # Removed PlacePhoto alias, kept Photo
from core.serializers import PlaceSerializer, ReviewSerializer, NotificationSerializer, PhotoSerializer


User = get_user_model()

class NotificationViewSetTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser_notif',
            email='testnotif@example.com',
            password='testpass123',
            first_name='TestNotif',
            last_name='UserNotif'
        )

        self.test_place_for_notification = Place.objects.create(
            name='Notification Test Place',
            description='A place for notification tests',
            place_type='restaurant', # Make sure this is a valid choice from PLACE_TYPE_CHOICES
            price_level=200,         # Make sure this is a valid choice from PRICE_LEVEL_CHOICES
            address='123 Notif St',
            district='xinyi',        # Make sure this is a valid choice
            created_by=self.user
        )
        self.test_review_for_notification = Review.objects.create(
            place=self.test_place_for_notification,
            user=self.user,
            comment='Review for notification test',
            overall_rating=4
        )
        
        print(f"DEBUG SETUP: Review model name: {Review._meta.model_name}") # For initial setup verification
        print(f"DEBUG SETUP: Test review ID: {self.test_review_for_notification.id}")
        
        review_content_type = ContentType.objects.get_for_model(Review) # Define review_content_type

        self.notification = Notification.objects.create(
            user=self.user,
            notification_type='new_review',
            title='Test notification',
            message='Test notification message',
            is_read=False,
            content_type=review_content_type,  # CHANGED KEYWORD and ensure value is ContentType object
            object_id=self.test_review_for_notification.id # CHANGED KEYWORD
        )
        self.client.force_authenticate(user=self.user)

    def test_list_notifications(self):
        """Test retrieving a list of notifications"""
        notification_from_db = Notification.objects.get(id=self.notification.id)
        print(f"DEBUG IN TEST LIST: Notification from DB ID: {notification_from_db.id}")
        print(f"DEBUG IN TEST LIST: Notification from DB type: {type(notification_from_db)}")
        print(f"DEBUG IN TEST LIST: Notification content_type: {notification_from_db.content_type}")
        print(f"DEBUG IN TEST LIST: Notification object_id: {notification_from_db.object_id}")
        
        url = reverse('notification-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        if response.status_code == status.HTTP_200_OK: # Avoid error if list is empty due to other issues
            self.assertGreaterEqual(len(response.data.get('results', [])), 1) # Check if at least one
            if response.data.get('results'):
                 self.assertEqual(response.data['results'][0]['title'], 'Test notification')


    def test_mark_notification_read(self):
        """Test marking a notification as read"""
        notification_from_db = Notification.objects.get(id=self.notification.id)
        print(f"DEBUG IN TEST MARK_READ: Notification from DB ID: {notification_from_db.id}")
        print(f"DEBUG IN TEST MARK_READ: Notification from DB type: {type(notification_from_db)}")
        print(f"DEBUG IN TEST MARK_READ: Notification content_type: {notification_from_db.content_type}")
        print(f"DEBUG IN TEST MARK_READ: Notification object_id: {notification_from_db.object_id}")
        
        url = reverse('notification-mark-read', kwargs={'pk': self.notification.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notification.refresh_from_db()
        self.assertTrue(self.notification.is_read)

class PlaceViewSetTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser_place', 
            email='testplace@example.com', 
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        
        # Create some features for testing
        self.feature1 = Feature.objects.create(name="WiFi", feature_type="general")
        self.feature2 = Feature.objects.create(name="Parking", feature_type="general")

        self.place_data = {
            'name': 'Test Place',
            'description': 'Test Description',
            'placeType': 'restaurant', # API uses camelCase
            'priceLevel': 200,         # API uses camelCase
            'address': '123 Test St',
            'district': 'xinyi',
            'createdBy': self.user.id, # API uses camelCase for this too, source='created_by' handles it
            'featureIds': [self.feature1.id, self.feature2.id] # API uses camelCase
        }
        self.place = Place.objects.create(
            name='Existing Place', 
            created_by=self.user,
            place_type='restaurant',
            price_level=200,
            address='456 Old St',
            district='daan'
        )

    def test_create_place(self):
        """Test creating a new place"""
        url = reverse('place-list')
        response = self.client.post(url, self.place_data, format='json') # Ensure format is json
        if response.status_code != status.HTTP_201_CREATED:
            print(f"DEBUG Create Place response: {response.data}") 
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Place.objects.count(), 2) # One from setup, one created
        created_place = Place.objects.get(name='Test Place')
        self.assertIsNotNone(created_place)
        self.assertEqual(created_place.features.count(), 2)


    def test_update_place(self):
        """Test updating an existing place"""
        url = reverse('place-detail', kwargs={'pk': self.place.pk})
        updated_data = {
            'name': 'Updated Place Name',
            'description': 'Updated description.',
            'website': 'http://updated.example.com',
            'featureIds': [self.feature1.id] # Update features
        }
        response = self.client.patch(url, updated_data, format='json')
        if response.status_code != status.HTTP_200_OK:
            print(f"DEBUG Update Place response: {response.data}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.place.refresh_from_db()
        self.assertEqual(self.place.name, 'Updated Place Name')
        self.assertEqual(self.place.website, 'http://updated.example.com')
        self.assertEqual(self.place.features.count(), 1)
        self.assertTrue(self.place.features.filter(id=self.feature1.id).exists())

class ReviewViewSetTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='reviewtestuser', # Ensure username is provided
            email='test@example.com',
            password='testpass123'
        )
        self.place = Place.objects.create(
            name='Review Test Place', 
            created_by=self.user,
            place_type='restaurant',
            price_level=200,
            address='789 Review St',
            district='zhongshan'
        )
        # This review is created by self.user for self.place
        self.existing_review = Review.objects.create(
            place=self.place,
            user=self.user,
            comment='Initial review.',
            overall_rating=3
        )
        self.client.force_authenticate(user=self.user)

    def test_create_review(self):
        """Test creating a new review"""
        # Create a different user for this test to avoid unique_together constraint
        other_user = User.objects.create_user(
            username='other_review_user',
            email='other@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=other_user) # Authenticate as the new user

        url = reverse('place-reviews-list', kwargs={'place_pk': self.place.id})
        data = {
            'comment': 'Great place!',
            'overallRating': 5,      # API uses camelCase
            'foodQuality': 5,        # API uses camelCase
            'service': 4,            # API uses camelCase
            'value': 4,              # API uses camelCase
            'cleanliness': 5         # API uses camelCase
        }
        response = self.client.post(url, data, format='json')
        if response.status_code != status.HTTP_201_CREATED:
            print(f"DEBUG Create Review response: {response.data}")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Review.objects.filter(place=self.place).count(), 2) # Existing + new one

class PhotoViewSetTests(APITestCase):
    # TODO: Implement tests for PhotoViewSet
    pass
