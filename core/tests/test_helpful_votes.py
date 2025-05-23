from django.test import TestCase
from django.urls import reverse, get_resolver, resolve, Resolver404
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from core.models import Place, Review, HelpfulVote, Notification
from django.urls import get_resolver, URLPattern, URLResolver
import pytest

User = get_user_model()

def list_urls(lis=None, parent_pattern=''):
    if lis is None:
        lis = get_resolver().url_patterns
    urls = []
    for entry in lis:
        if isinstance(entry, URLPattern):
            pattern = parent_pattern + str(entry.pattern)
            urls.append(pattern)
        elif isinstance(entry, URLResolver):
            nested_pattern = parent_pattern + str(entry.pattern)
            urls += list_urls(entry.url_patterns, parent_pattern=nested_pattern)
    return urls

class HelpfulVotesSystemTest(APITestCase):
    """Test case for the Helpful Votes system."""
    
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        print("\n--- All Registered URLs (recursive) ---")
        for url in list_urls():
            print(url)
        print("--- End Registered URLs ---\n")
        # Try to resolve a sample helpful vote URL with and without 'api/'
        sample_place_id = 1
        sample_review_id = 1
        for prefix in ["api/", ""]:
            test_url = f"/{prefix}places/{sample_place_id}/reviews/{sample_review_id}/helpful/"
            try:
                match = resolve(test_url)
                print(f"Resolved {test_url} to view: {match.view_name}")
            except Resolver404:
                print(f"Could NOT resolve {test_url}")
        print("--- End URL resolution test ---\n")
    
    def setUp(self):
        """Set up test data."""
        # Create users
        self.review_author = User.objects.create_user(
            username='author',
            email='author@example.com',
            password='testpassword'
        )
        
        self.voter = User.objects.create_user(
            username='voter',
            email='voter@example.com',
            password='testpassword'
        )
        
        self.another_voter = User.objects.create_user(
            username='another',
            email='another@example.com',
            password='testpassword'
        )
        
        # Create a place
        self.place = Place.objects.create(
            name='Test Place',
            description='A place for testing helpful votes',
            place_type='restaurant',
            price_level='600',
            address='123 Test Street',
            district='xinyi',
            created_by=self.review_author,
            moderation_status='APPROVED'
        )
        
        # Create a review
        self.review = Review.objects.create(
            place=self.place,
            user=self.review_author,
            overall_rating=4,
            food_quality=4,
            service=4,
            value=4,
            comment='This is a test review for helpful votes',
            moderation_status='APPROVED'
        )
        
        # Assert place and review exist
        assert Place.objects.filter(id=self.place.id).exists(), f"Place {self.place.id} does not exist!"
        assert Review.objects.filter(id=self.review.id).exists(), f"Review {self.review.id} does not exist!"
        
        # Set up API client
        self.client = APIClient()
    
    def test_toggle_helpful_vote(self):
        """Test toggling a helpful vote on and off."""
        self.client.force_authenticate(user=self.voter)
        
        helpful_url = reverse('place-reviews-helpful', kwargs={
            'place_pk': self.place.pk, # Use .pk for consistency with other tests
            'pk': self.review.pk
        })
        
        # First vote (toggle on)
        response_on = self.client.post(helpful_url)
        self.assertEqual(response_on.status_code, status.HTTP_200_OK)
        self.assertTrue(HelpfulVote.objects.filter(review=self.review, user=self.voter).exists())
        self.review.refresh_from_db() # Refresh review instance
        self.assertEqual(self.review.helpful_count, 1)

        # Second vote (toggle off)
        response_off = self.client.post(helpful_url)
        self.assertEqual(response_off.status_code, status.HTTP_200_OK)
        self.assertFalse(HelpfulVote.objects.filter(review=self.review, user=self.voter).exists())
        self.review.refresh_from_db() # Refresh review instance
        self.assertEqual(self.review.helpful_count, 0)

    def test_unauthenticated_user_cannot_vote(self):
        """Test that unauthenticated users cannot vote."""
        # Ensure client is not authenticated (default state after APIClient())
        # self.client.logout() # Or ensure no force_authenticate is active if it was set globally

        helpful_url = reverse('place-reviews-helpful', kwargs={
            'place_pk': self.place.pk,
            'pk': self.review.pk
        })
        
        response = self.client.post(helpful_url)
        # Expect 401 Unauthorized or 403 Forbidden if IsAuthenticated permission is used
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
        self.assertEqual(HelpfulVote.objects.count(), 0)

    def test_multiple_voters(self):
        """Test that multiple users can mark a review as helpful."""
        helpful_url = reverse('place-reviews-helpful', kwargs={
            'place_pk': self.place.pk,
            'pk': self.review.pk
        })

        # First voter
        self.client.force_authenticate(user=self.voter)
        response_voter1 = self.client.post(helpful_url)
        self.assertEqual(response_voter1.status_code, status.HTTP_200_OK)
        self.assertTrue(HelpfulVote.objects.filter(review=self.review, user=self.voter).exists())
        self.review.refresh_from_db()
        self.assertEqual(self.review.helpful_count, 1)

        # Second voter
        self.client.force_authenticate(user=self.another_voter)
        response_voter2 = self.client.post(helpful_url)
        self.assertEqual(response_voter2.status_code, status.HTTP_200_OK)
        self.assertTrue(HelpfulVote.objects.filter(review=self.review, user=self.another_voter).exists())
        self.review.refresh_from_db()
        self.assertEqual(self.review.helpful_count, 2)

        # First voter toggles off
        self.client.force_authenticate(user=self.voter)
        response_voter1_off = self.client.post(helpful_url)
        self.assertEqual(response_voter1_off.status_code, status.HTTP_200_OK)
        self.assertFalse(HelpfulVote.objects.filter(review=self.review, user=self.voter).exists())
        self.review.refresh_from_db()
        self.assertEqual(self.review.helpful_count, 1)

    def test_helpful_count_in_review_response(self):
        """Test that the helpful_count is included in the review response."""
        review_detail_url = reverse('place-reviews-detail', kwargs={
            'place_pk': self.place.pk,
            'pk': self.review.pk
        })
        helpful_url = reverse('place-reviews-helpful', kwargs={
            'place_pk': self.place.pk,
            'pk': self.review.pk
        })

        # Initial state: 0 helpful votes
        self.client.force_authenticate(user=self.voter) # Authenticate to view review
        response = self.client.get(review_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['helpfulCount'], 0)

        # First voter votes
        vote_response1 = self.client.post(helpful_url)
        self.assertEqual(vote_response1.status_code, status.HTTP_200_OK)
        
        response = self.client.get(review_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['helpfulCount'], 1)

        # Second voter votes
        self.client.force_authenticate(user=self.another_voter)
        vote_response2 = self.client.post(helpful_url)
        self.assertEqual(vote_response2.status_code, status.HTTP_200_OK)
        
        # Need to re-authenticate as original voter to get review detail if permissions are strict,
        # or ensure another_voter can also view it. Assuming any authenticated user can view.
        response = self.client.get(review_detail_url) 
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['helpfulCount'], 2)

    def test_reverse_place_reviews_helpful(self):
        """Test URL reverse for the review helpful endpoint."""
        # The main purpose is to ensure reverse() doesn't fail due to misconfiguration
        try:
            # Based on setUpClass output, the path is prefixed with /api/
            expected_url = f'/api/places/{self.place.pk}/reviews/{self.review.pk}/helpful/'
            resolved_url = reverse('place-reviews-helpful', kwargs={
                'place_pk': self.place.pk,
                'pk': self.review.pk
            })
            self.assertEqual(resolved_url, expected_url)
        except Exception as e:
            self.fail(f"URL reversing failed for 'place-reviews-helpful': {str(e)}")

    def test_author_cannot_vote_own_review(self):
        """Test that review authors cannot vote on their own reviews."""
        self.client.force_authenticate(user=self.review_author)
        
        helpful_url = reverse('place-reviews-helpful', kwargs={
            'place_pk': self.place.id,
            'pk': self.review.id
        })
        
        response = self.client.post(helpful_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('own review', response.data['detail'].lower())
        
        # Verify no vote was created
        self.assertEqual(HelpfulVote.objects.filter(review=self.review).count(), 0) 