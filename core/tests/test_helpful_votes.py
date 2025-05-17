from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from core.models import Place, Review, HelpfulVote, Notification

User = get_user_model()

class HelpfulVotesSystemTest(APITestCase):
    """Test case for the Helpful Votes system."""
    
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
            type='restaurant',
            price_range='600',
            address='123 Test Street',
            district='xinyi',
            user=self.review_author,
            moderation_status='APPROVED'
        )
        
        # Create a review
        self.review = Review.objects.create(
            place=self.place,
            user=self.review_author,
            overall_rating=4,
            food_rating=4,
            service_rating=4,
            value_rating=4,
            comment='This is a test review for helpful votes',
            moderation_status='approved'
        )
        
        # Set up API client
        self.client = APIClient()
    
    def test_toggle_helpful_vote(self):
        """Test toggling a helpful vote on a review."""
        self.client.force_authenticate(user=self.voter)
        
        # Get the URL for the helpful action
        helpful_url = reverse('place-reviews-helpful', kwargs={
            'place_pk': self.place.id,
            'pk': self.review.id
        })
        
        # 1. Test adding a vote
        response = self.client.post(helpful_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['action'], 'added')
        self.assertEqual(response.data['helpful_count'], 1)
        
        # Check that a notification was created for the review author
        notification = Notification.objects.filter(
            user=self.review_author,
            notification_type='review_helpful'
        ).first()
        self.assertIsNotNone(notification)
        
        # 2. Test removing a vote (toggle off)
        response = self.client.post(helpful_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['action'], 'removed')
        self.assertEqual(response.data['helpful_count'], 0)
        
        # 3. Test adding the vote again
        response = self.client.post(helpful_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['action'], 'added')
        self.assertEqual(response.data['helpful_count'], 1)
    
    def test_multiple_voters(self):
        """Test that multiple users can vote on the same review."""
        # First voter adds a vote
        self.client.force_authenticate(user=self.voter)
        helpful_url = reverse('place-reviews-helpful', kwargs={
            'place_pk': self.place.id,
            'pk': self.review.id
        })
        response = self.client.post(helpful_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['helpful_count'], 1)
        
        # Second voter adds a vote
        self.client.force_authenticate(user=self.another_voter)
        response = self.client.post(helpful_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['helpful_count'], 2)
        
        # Check the total count in the database
        self.review.refresh_from_db()
        self.assertEqual(self.review.helpful_count, 2)
        self.assertEqual(HelpfulVote.objects.filter(review=self.review).count(), 2)
    
    def test_author_cannot_vote_own_review(self):
        """Test that authors cannot mark their own reviews as helpful."""
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
    
    def test_unauthenticated_user_cannot_vote(self):
        """Test that unauthenticated users cannot mark reviews as helpful."""
        self.client.force_authenticate(user=None)
        
        helpful_url = reverse('place-reviews-helpful', kwargs={
            'place_pk': self.place.id,
            'pk': self.review.id
        })
        
        response = self.client.post(helpful_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Verify no vote was created
        self.assertEqual(HelpfulVote.objects.filter(review=self.review).count(), 0)
    
    def test_helpful_count_in_review_response(self):
        """Test that the helpful_count is included in review responses."""
        # Add some votes
        HelpfulVote.objects.create(review=self.review, user=self.voter)
        HelpfulVote.objects.create(review=self.review, user=self.another_voter)
        
        # Update the review's helpful_count field
        self.review.helpful_count = 2
        self.review.save()
        
        # Get the review details
        self.client.force_authenticate(user=self.voter)
        url = reverse('place-reviews-detail', kwargs={
            'place_pk': self.place.id,
            'pk': self.review.id
        })
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['helpful_count'], 2) 