from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from core.models import Place, SavedPlace
import json
from datetime import timedelta
from django.utils import timezone

User = get_user_model()

class SavedPlaceModelTest(TestCase):
    """Test case for the SavedPlace model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpassword"
        )
        
        self.place = Place.objects.create(
            name="Test Place",
            type="restaurant",
            price_range="1000",
            user=self.user,
            moderation_status="approved"
        )
        
        self.saved_place = SavedPlace.objects.create(
            user=self.user,
            place=self.place,
            notes="My favorite restaurant"
        )
    
    def test_saved_place_creation(self):
        """Test saved place creation with notes."""
        self.assertEqual(self.saved_place.notes, "My favorite restaurant")
        self.assertEqual(self.saved_place.user, self.user)
        self.assertEqual(self.saved_place.place, self.place)
    
    def test_unique_constraint(self):
        """Test that a user cannot save the same place twice."""
        with self.assertRaises(Exception):
            SavedPlace.objects.create(
                user=self.user,
                place=self.place,
                notes="Another note"
            )


class SavedPlaceAPITest(APITestCase):
    """Test the Saved Places API."""
    
    def setUp(self):
        """Set up test data."""
        # Create test users
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='password123'
        )
        self.other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='password123'
        )
        
        # Create test places
        self.place1 = Place.objects.create(
            name='Test Restaurant',
            description='A test restaurant',
            type='restaurant',
            price_range='1000',
            address='123 Test Street, Test City',
            district='Test District',
            user=self.user,
            moderation_status='approved'
        )
        
        self.place2 = Place.objects.create(
            name='Test Cafe',
            description='A test cafe',
            type='cafe',
            price_range='2000',
            address='456 Coffee Avenue, Test City',
            district='Coffee District',
            user=self.user,
            moderation_status='approved'
        )
        
        self.place3 = Place.objects.create(
            name='Test Bar',
            description='A test bar',
            type='bar',
            price_range='3000',
            address='789 Bar Street, Test City',
            district='Bar District',
            user=self.other_user,
            moderation_status='approved'
        )
        
        # Create a saved place
        self.saved_place = SavedPlace.objects.create(
            user=self.user,
            place=self.place1,
            notes='This is a great restaurant'
        )
        
        # Set up API client
        self.client = APIClient()
        
    def test_list_saved_places(self):
        """Test listing saved places."""
        # Authenticate the user
        self.client.force_authenticate(user=self.user)
        
        # Get the list of saved places
        url = reverse('saved-place-list')
        response = self.client.get(url)
        
        # Check the response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['place'], self.place1.id)
        
    def test_create_saved_place(self):
        """Test creating a new saved place."""
        # Authenticate the user
        self.client.force_authenticate(user=self.user)
        
        # Create a new saved place
        url = reverse('saved-place-list')
        data = {
            'place': self.place2.id,
            'notes': 'Great coffee here'
        }
        response = self.client.post(url, data)
        
        # Check the response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['place'], self.place2.id)
        self.assertEqual(response.data['notes'], 'Great coffee here')
        
        # Check the database
        self.assertEqual(SavedPlace.objects.count(), 2)
        
    def test_retrieve_saved_place(self):
        """Test retrieving a specific saved place."""
        # Authenticate the user
        self.client.force_authenticate(user=self.user)
        
        # Get the saved place
        url = reverse('saved-place-detail', args=[self.saved_place.id])
        response = self.client.get(url)
        
        # Check the response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['place'], self.place1.id)
        self.assertEqual(response.data['notes'], 'This is a great restaurant')
        
    def test_update_saved_place(self):
        """Test updating a saved place."""
        # Authenticate the user
        self.client.force_authenticate(user=self.user)
        
        # Update the saved place
        url = reverse('saved-place-detail', args=[self.saved_place.id])
        data = {
            'notes': 'Updated notes'
        }
        response = self.client.patch(url, data)
        
        # Check the response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['notes'], 'Updated notes')
        
        # Check the database
        self.saved_place.refresh_from_db()
        self.assertEqual(self.saved_place.notes, 'Updated notes')
        
    def test_delete_saved_place(self):
        """Test deleting a saved place."""
        # Authenticate the user
        self.client.force_authenticate(user=self.user)
        
        # Delete the saved place
        url = reverse('saved-place-detail', args=[self.saved_place.id])
        response = self.client.delete(url)
        
        # Check the response
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Check the database
        self.assertEqual(SavedPlace.objects.count(), 0)
        
    def test_toggle_saved_place(self):
        """Test toggling a place as saved/unsaved."""
        # Authenticate the user
        self.client.force_authenticate(user=self.user)
        
        # Toggle place2 (save it)
        url = reverse('saved-place-toggle')
        data = {
            'place_id': self.place2.id,
            'notes': 'Toggled saved place'
        }
        response = self.client.post(url, data)
        
        # Check the response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['place'], self.place2.id)
        
        # Check the database
        self.assertEqual(SavedPlace.objects.count(), 2)
        
        # Toggle place2 again (unsave it)
        response = self.client.post(url, data)
        
        # Check the response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'removed')
        
        # Check the database
        self.assertEqual(SavedPlace.objects.count(), 1)
        
    def test_is_saved_endpoint(self):
        """Test the is_saved endpoint."""
        # Authenticate the user
        self.client.force_authenticate(user=self.user)
        
        # Check if place1 is saved
        url = reverse('saved-place-is-saved')
        response = self.client.get(f"{url}?place_id={self.place1.id}")
        
        # Check the response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_saved'])
        
        # Check if place2 is saved (it's not)
        response = self.client.get(f"{url}?place_id={self.place2.id}")
        
        # Check the response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_saved'])
        
    def test_filtering_saved_places(self):
        """Test filtering saved places."""
        # Create an additional saved place for testing filters
        SavedPlace.objects.create(
            user=self.user,
            place=self.place2,
            notes='Nice cafe with good pastries'
        )
        
        SavedPlace.objects.create(
            user=self.user,
            place=self.place3,
            notes='Good beer selection'
        )
        
        # Authenticate the user
        self.client.force_authenticate(user=self.user)
        
        # Test filtering by district
        url = reverse('saved-place-list')
        response = self.client.get(f"{url}?district=Coffee District")
        
        # Check the response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['place'], self.place2.id)
        
        # Test filtering by place type
        response = self.client.get(f"{url}?place_type=bar")
        
        # Check the response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['place'], self.place3.id)
        
        # Test search filter
        response = self.client.get(f"{url}?search=pastries")
        
        # Check the response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['place'], self.place2.id)
        
    def test_batch_save_places(self):
        """Test batch saving places."""
        # Delete existing saved places for a clean slate
        SavedPlace.objects.all().delete()
        
        # Authenticate the user
        self.client.force_authenticate(user=self.user)
        
        # Batch save places
        url = reverse('saved-place-batch-save')
        data = {
            'place_ids': [self.place1.id, self.place2.id, self.place3.id]
        }
        response = self.client.post(url, data, format='json')
        
        # Check the response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertIn('Added 3 places', response.data['message'])
        
        # Check the database
        self.assertEqual(SavedPlace.objects.count(), 3)
        
    def test_batch_unsave_places(self):
        """Test batch unsaving places."""
        # Create additional saved places
        SavedPlace.objects.create(
            user=self.user,
            place=self.place2
        )
        
        SavedPlace.objects.create(
            user=self.user,
            place=self.place3
        )
        
        # Authenticate the user
        self.client.force_authenticate(user=self.user)
        
        # Batch unsave places
        url = reverse('saved-place-batch-unsave')
        data = {
            'place_ids': [self.place1.id, self.place3.id]
        }
        response = self.client.post(url, data, format='json')
        
        # Check the response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertIn('Removed 2 places', response.data['message'])
        
        # Check the database
        self.assertEqual(SavedPlace.objects.count(), 1)
        self.assertEqual(SavedPlace.objects.first().place.id, self.place2.id)
        
    def test_batch_update_notes(self):
        """Test batch updating notes."""
        # Create additional saved places
        SavedPlace.objects.create(
            user=self.user,
            place=self.place2,
            notes='Original notes for place 2'
        )
        
        SavedPlace.objects.create(
            user=self.user,
            place=self.place3,
            notes='Original notes for place 3'
        )
        
        # Authenticate the user
        self.client.force_authenticate(user=self.user)
        
        # Batch update notes
        url = reverse('saved-place-batch-update-notes')
        data = {
            'updates': [
                {'place_id': self.place1.id, 'notes': 'Updated notes for place 1'},
                {'place_id': self.place2.id, 'notes': 'Updated notes for place 2'},
                {'place_id': 999, 'notes': 'This place does not exist'}  # Test error handling
            ]
        }
        response = self.client.post(url, data, format='json')
        
        # Check the response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertEqual(response.data['updated_count'], 2)
        self.assertEqual(len(response.data['errors']), 1)
        
        # Check the database
        place1_saved = SavedPlace.objects.get(place=self.place1)
        place2_saved = SavedPlace.objects.get(place=self.place2)
        place3_saved = SavedPlace.objects.get(place=self.place3)
        
        self.assertEqual(place1_saved.notes, 'Updated notes for place 1')
        self.assertEqual(place2_saved.notes, 'Updated notes for place 2')
        self.assertEqual(place3_saved.notes, 'Original notes for place 3')
        
    def test_unauthenticated_access(self):
        """Test that unauthenticated users cannot access the API."""
        # Do not authenticate the user
        
        # Try to get the list of saved places
        url = reverse('saved-place-list')
        response = self.client.get(url)
        
        # Check the response
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_other_user_access(self):
        """Test that users cannot access each other's saved places."""
        # Authenticate as the other user
        self.client.force_authenticate(user=self.other_user)
        
        # Try to get the saved place
        url = reverse('saved-place-detail', args=[self.saved_place.id])
        response = self.client.get(url)
        
        # Check the response
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
    def test_ordering_saved_places(self):
        """Test ordering saved places."""
        # Create saved places with different timestamps
        yesterday = timezone.now() - timedelta(days=1)
        last_week = timezone.now() - timedelta(days=7)
        
        # Create a place with an older timestamp
        place2_saved = SavedPlace.objects.create(
            user=self.user,
            place=self.place2,
            notes='Saved last week'
        )
        place2_saved.created_at = last_week
        place2_saved.save()
        
        place3_saved = SavedPlace.objects.create(
            user=self.user,
            place=self.place3,
            notes='Saved yesterday'
        )
        place3_saved.created_at = yesterday
        place3_saved.save()
        
        # Authenticate the user
        self.client.force_authenticate(user=self.user)
        
        # Get saved places ordered by created_at descending (newest first)
        url = reverse('saved-place-list')
        response = self.client.get(f"{url}?ordering=-created_at")
        
        # Check the response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 3)
        self.assertEqual(results[0]['place'], self.place1.id)  # Most recent
        self.assertEqual(results[1]['place'], self.place3.id)  # Yesterday
        self.assertEqual(results[2]['place'], self.place2.id)  # Last week
        
        # Get saved places ordered by place name
        response = self.client.get(f"{url}?ordering=place__name")
        
        # Check the response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 3)
        self.assertEqual(results[0]['place'], self.place3.id)  # Bar - alphabetically first
        self.assertEqual(results[1]['place'], self.place2.id)  # Cafe
        self.assertEqual(results[2]['place'], self.place1.id)  # Restaurant 