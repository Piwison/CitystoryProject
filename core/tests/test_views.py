from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from core.models import Place, Review, PlacePhoto, Notification
from rest_framework import status

User = get_user_model()

class NotificationViewSetTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.notification = Notification.objects.create(
            user=self.user,
            notification_type='new_review',
            title='Test notification',
            message='Test notification message',
            is_read=False
        )
        self.client.force_authenticate(user=self.user)

    def test_list_notifications(self):
        """Test retrieving a list of notifications"""
        url = reverse('notification-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_mark_notification_read(self):
        """Test marking a notification as read"""
        url = reverse('notification-mark-read', kwargs={'pk': self.notification.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notification.refresh_from_db()
        self.assertTrue(self.notification.is_read)

class PlaceViewSetTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        self.place_data = {
            'name': 'Test Place',
            'description': 'Test Description',
            'placeType': 'restaurant',
            'priceLevel': 200,  # integer value
            'address': '123 Test St',
            'district': 'xinyi',
        }
    
    def test_create_place(self):
        """Test creating a new place"""
        url = reverse('place-list')
        response = self.client.post(url, self.place_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Place.objects.count(), 1)
        self.assertEqual(Place.objects.get().name, 'Test Place')
    
    def test_update_place(self):
        """Test updating an existing place"""
        place = Place.objects.create(
            created_by=self.user,
            name=self.place_data['name'],
            description=self.place_data['description'],
            place_type=self.place_data['placeType'],
            price_level=self.place_data['priceLevel'],
            address=self.place_data['address'],
            district=self.place_data['district']
        )
        url = reverse('place-detail', args=[place.id])
        updated_data = {
            'name': 'Updated Place',
            'description': 'Updated Description'
        }
        response = self.client.patch(url, updated_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Place.objects.get().name, 'Updated Place')

class ReviewViewSetTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.place = Place.objects.create(
            name='Test Place',
            description='Test Description',
            place_type='restaurant',
            price_level=200,
            address='123 Test St',
            district='xinyi',
            created_by=self.user
        )
        self.review = Review.objects.create(
            place=self.place,
            user=self.user,
            comment='Test Review',
            overall_rating=4,
            food_quality=4,
            service=4,
            value=4,
            cleanliness=4
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_create_review(self):
        """Test creating a new review"""
        url = reverse('place-reviews-list', kwargs={'place_pk': self.place.id})
        data = {
            'comment': 'Great place!',
            'overallRating': 5,
            'foodQuality': 5,
            'service': 4,
            'value': 4,
            'cleanliness': 5
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Review.objects.count(), 2)
    
    def test_update_review(self):
        """Test updating an existing review"""
        url = reverse('place-reviews-detail', kwargs={
            'place_pk': self.place.id,
            'pk': self.review.id
        })
        data = {'comment': 'Updated review'}
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Review.objects.get().comment, 'Updated review')

class PhotoViewSetTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.place = Place.objects.create(
            name='Test Place',
            description='Test Description',
            place_type='restaurant',
            price_level=200,
            address='123 Test St',
            district='xinyi',
            created_by=self.user
        )
        self.photo = PlacePhoto.objects.create(
            place=self.place,
            user=self.user,
            caption='Test Photo'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_create_photo(self):
        """Test uploading a new photo"""
        url = reverse('place-photos-list', kwargs={'place_pk': self.place.id})
        with open('test_image.jpg', 'rb') as image:
            data = {
                'image': image,
                'caption': 'New photo'
            }
            response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PlacePhoto.objects.count(), 2)
    
    def test_update_photo(self):
        """Test updating an existing photo"""
        url = reverse('place-photos-detail', kwargs={
            'place_pk': self.place.id,
            'pk': self.photo.id
        })
        data = {'caption': 'Updated caption'}
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(PlacePhoto.objects.get().caption, 'Updated caption') 