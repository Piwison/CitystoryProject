from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from core.models import Place, Review, Notification
from django.contrib.auth.models import Group
from django.urls import get_resolver

User = get_user_model()

class PlaceStatusWorkflowTest(APITestCase):
    """Test case for the place status workflow."""
    
    def setUp(self):
        """Set up test data."""
        # Create users
        self.regular_user = User.objects.create_user(
            username='user',
            email='user@example.com',
            password='testpassword'
        )
        self.moderator = User.objects.create_user(
            username='moderator',
            email='moderator@example.com',
            password='testpassword',
            is_staff=True
        )
        
        # Create a moderator group for permissions
        moderators_group, created = Group.objects.get_or_create(name='moderators')
        self.moderator.groups.add(moderators_group)
        
        # Create places with different statuses
        self.draft_place = Place.objects.create(
            name='Draft Place',
            description='A place in draft status',
            user=self.regular_user,
            type='restaurant',
            price_range='600',
            address='123 Test Street',
            district='xinyi',
            draft=True,
            moderation_status='PENDING'
        )
        
        self.pending_place = Place.objects.create(
            name='Pending Place',
            description='A place waiting for approval',
            user=self.regular_user,
            type='cafe',
            price_range='400',
            address='456 Test Avenue',
            district='daan',
            draft=False,
            moderation_status='PENDING'
        )
        
        self.approved_place = Place.objects.create(
            name='Approved Place',
            description='An approved place',
            user=self.regular_user,
            type='bar',
            price_range='800',
            address='789 Test Boulevard',
            district='zhongshan',
            draft=False,
            moderation_status='APPROVED'
        )
        
        self.rejected_place = Place.objects.create(
            name='Rejected Place',
            description='A rejected place',
            user=self.regular_user,
            type='shop',
            price_range='200',
            address='101 Test Road',
            district='songshan',
            draft=False,
            moderation_status='REJECTED'
        )
        
        # Set up API client
        self.client = APIClient()
    
    def test_place_visibility_for_anonymous_users(self):
        """Test that anonymous users can only see approved places."""
        # Make sure we're not authenticated
        self.client.force_authenticate(user=None)
        
        response = self.client.get(reverse('place-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Only approved places should be visible
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], self.approved_place.name)
    
    def test_place_visibility_for_regular_users(self):
        """Test that regular users can see approved places and their own places."""
        self.client.force_authenticate(user=self.regular_user)
        
        response = self.client.get(reverse('place-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should see all their own places + approved places from others
        self.assertEqual(len(response.data['results']), 4)  # All places belong to this user
        
        # Create a place for another user
        another_user = User.objects.create_user(
            username='another',
            email='another@example.com',
            password='testpassword'
        )
        
        Place.objects.create(
            name='Another User Place',
            description='A place from another user',
            user=another_user,
            type='restaurant',
            price_range='600',
            address='999 Another Street',
            district='xinyi',
            draft=False,
            moderation_status='pending'
        )
        
        # Should not see pending places from other users
        response = self.client.get(reverse('place-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [place['name'] for place in response.data['results']]
        self.assertNotIn('Another User Place', names)
    
    def test_place_submission_workflow(self):
        """Test the entire place submission workflow."""
        self.client.force_authenticate(user=self.regular_user)
        
        # 1. Create a new draft place
        new_place_data = {
            'name': 'New Test Place',
            'description': 'A new place to test the workflow',
            'type': 'restaurant',
            'price_range': '600',
            'address': '777 Workflow Street',
            'district': 'xinyi'
        }
        
        response = self.client.post(reverse('place-list'), new_place_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        place_id = response.data['id']
        
        # Verify it was created as a draft with pending status
        place = Place.objects.get(id=place_id)
        self.assertTrue(place.draft)
        self.assertEqual(place.moderation_status, 'PENDING')
        
        # 2. Submit place for review (publish)
        publish_url = reverse('place-publish', kwargs={'pk': place_id})
        # Let's list all available URL patterns for debugging
        url_patterns = get_resolver().reverse_dict.keys()
        # Try to find the right URL pattern for place publish
        for pattern in url_patterns:
            if isinstance(pattern, str) and 'publish' in pattern:
                publish_url = reverse(pattern, kwargs={'pk': place_id})
                break
                
        response = self.client.post(publish_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify it's no longer a draft but still pending approval
        place.refresh_from_db()
        self.assertFalse(place.draft)
        self.assertEqual(place.moderation_status, 'PENDING')
        
        # 3. Moderator approves the place
        self.client.force_authenticate(user=self.moderator)
        moderation_url = reverse('moderation-places-update-status', kwargs={'pk': place_id})
        
        response = self.client.patch(moderation_url, {'status': 'APPROVED'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify place is now approved
        place.refresh_from_db()
        self.assertEqual(place.moderation_status, 'APPROVED')
        
        # Check that a notification was created
        notification = Notification.objects.filter(
            related_object_id=place_id,
            user=self.regular_user
        ).first()
        self.assertIsNotNone(notification)
        self.assertEqual(notification.notification_type, 'place_approved')
    
    def test_moderator_place_rejection(self):
        """Test rejection of a place by a moderator with comments."""
        self.client.force_authenticate(user=self.moderator)
        
        moderation_url = reverse('moderation-places-update-status', kwargs={'pk': self.pending_place.id})
        response = self.client.patch(moderation_url, {
            'status': 'REJECTED',
            'comment': 'Information is incomplete or inaccurate'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify place is now rejected
        self.pending_place.refresh_from_db()
        self.assertEqual(self.pending_place.moderation_status, 'REJECTED')
        self.assertEqual(self.pending_place.moderation_comment, 'Information is incomplete or inaccurate')
        
        # Check that a notification was created
        notification = Notification.objects.filter(
            object_id=self.pending_place.id,
            user=self.regular_user,
            notification_type='place_rejected'
        ).first()
        self.assertIsNotNone(notification)
    
    def test_moderation_endpoint_access_control(self):
        """Test that only moderators can access moderation endpoints."""
        moderation_list_url = reverse('moderation-places-list')
        
        # Anonymous user access
        self.client.force_authenticate(user=None)
        response = self.client.get(moderation_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Regular user access
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(moderation_list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Moderator access
        self.client.force_authenticate(user=self.moderator)
        response = self.client.get(moderation_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_pending_places_in_moderation_queue(self):
        """Test that moderators can see pending places in the moderation queue."""
        self.client.force_authenticate(user=self.moderator)
        
        response = self.client.get(reverse('moderation-places-list') + '?status=pending')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should include at least one pending place
        # Response data could be either a list or dict with 'results' key
        data = response.data
        if isinstance(data, dict) and 'results' in data:
            data = data['results']
            
        # Look for our pending place in the response
        found_pending_place = False
        for place in data:
            if isinstance(place, dict) and place.get('name') == self.pending_place.name:
                found_pending_place = True
                break
                
        self.assertTrue(found_pending_place, "Pending place not found in moderation queue") 