from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from core.models import (
    Place, Review, Photo, Badge, UserBadge, 
    UserPoints, UserLevel, HelpfulVote, Notification
)

User = get_user_model()

class BadgeModelTest(TestCase):
    """Test case for the Badge model and requirement checking."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpassword"
        )
        
        # Create test badges
        self.first_place_badge = Badge.objects.create(
            name="First Place",
            description="Added your first place",
            type="place_contribution",
            level="bronze",
            points=10,
            requirement_code="first_place",
            requirement_description="Add a place that gets approved"
        )
        
        self.first_review_badge = Badge.objects.create(
            name="First Review",
            description="Wrote your first review",
            type="review_contribution",
            level="bronze",
            points=10,
            requirement_code="first_review",
            requirement_description="Write a review that gets approved"
        )
        
        self.helpful_reviewer_badge = Badge.objects.create(
            name="Helpful Reviewer",
            description="Your reviews are helpful to others",
            type="engagement",
            level="bronze",
            points=20,
            requirement_code="helpful_reviewer_bronze",
            requirement_description="Get 5 helpful votes on your reviews"
        )
    
    def test_badge_requirement_checker(self):
        """Test that badge requirements are correctly checked."""
        # Initially user doesn't meet any requirements
        self.assertFalse(Badge.BadgeRequirementChecker.check_first_place(self.user))
        self.assertFalse(Badge.BadgeRequirementChecker.check_first_review(self.user))
        
        # Create an approved place
        place = Place.objects.create(
            name="Test Place",
            type="restaurant",
            price_range="1000",
            user=self.user,
            moderation_status="APPROVED"
        )
        
        # Now user should meet the first place requirement
        self.assertTrue(Badge.BadgeRequirementChecker.check_first_place(self.user))
        
        # Create an approved review
        review = Review.objects.create(
            place=place,
            user=self.user,
            overall_rating=4,
            food_rating=4,
            service_rating=4,
            value_rating=4,
            comment="This is a test review",
            moderation_status="APPROVED"
        )
        
        # Now user should meet the first review requirement
        self.assertTrue(Badge.BadgeRequirementChecker.check_first_review(self.user))
        
        # User doesn't yet meet the helpful reviewer requirement
        self.assertFalse(Badge.BadgeRequirementChecker.check_helpful_reviewer_bronze(self.user))
        
        # Update the review to have 5 helpful votes
        review.helpful_count = 5
        review.save()
        
        # Now user should meet the helpful reviewer requirement
        self.assertTrue(Badge.BadgeRequirementChecker.check_helpful_reviewer_bronze(self.user))
    
    def test_check_eligibility(self):
        """Test that badge eligibility is correctly checked."""
        # Initially user isn't eligible for any badges
        eligible_badges = Badge.check_eligibility(self.user)
        self.assertEqual(len(eligible_badges), 0)
        
        # Create an approved place
        place = Place.objects.create(
            name="Test Place",
            type="restaurant",
            price_range="1000",
            user=self.user,
            moderation_status="APPROVED"
        )
        
        # User should now be eligible for the first place badge
        eligible_badges = Badge.check_eligibility(self.user)
        self.assertEqual(len(eligible_badges), 1)
        self.assertEqual(eligible_badges[0].requirement_code, "first_place")
        
        # Award the badge
        UserBadge.award_badge(self.user, self.first_place_badge)
        
        # User shouldn't be eligible for the badge again
        eligible_badges = Badge.check_eligibility(self.user)
        self.assertEqual(len(eligible_badges), 0)
        
        # Create an approved review
        review = Review.objects.create(
            place=place,
            user=self.user,
            overall_rating=4,
            food_rating=4,
            service_rating=4,
            value_rating=4,
            comment="This is a test review",
            moderation_status="APPROVED"
        )
        
        # User should now be eligible for the first review badge
        eligible_badges = Badge.check_eligibility(self.user)
        self.assertEqual(len(eligible_badges), 1)
        self.assertEqual(eligible_badges[0].requirement_code, "first_review")


class UserBadgeTest(TestCase):
    """Test case for the UserBadge model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpassword"
        )
        
        self.badge = Badge.objects.create(
            name="First Place",
            description="Added your first place",
            type="place_contribution",
            level="bronze",
            points=10,
            requirement_code="first_place",
            requirement_description="Add a place that gets approved"
        )
    
    def test_award_badge(self):
        """Test awarding a badge to a user."""
        # Award the badge
        user_badge, created = UserBadge.award_badge(self.user, self.badge)
        
        # The badge should have been created
        self.assertTrue(created)
        self.assertEqual(user_badge.user, self.user)
        self.assertEqual(user_badge.badge, self.badge)
        
        # Check that a notification was created
        notification = Notification.objects.filter(
            user=self.user,
            notification_type="badge_earned"
        ).first()
        
        self.assertIsNotNone(notification)
        self.assertEqual(notification.content_object, self.badge)
        
        # Check that points were awarded
        points = UserPoints.objects.filter(
            user=self.user,
            source_type="badge"
        ).first()
        
        self.assertIsNotNone(points)
        self.assertEqual(points.points, 10)
        
        # Try to award the badge again
        user_badge2, created2 = UserBadge.award_badge(self.user, self.badge)
        
        # The badge should not have been created again
        self.assertFalse(created2)
        self.assertEqual(user_badge2, user_badge)
        
        # Only one notification and points entry should exist
        self.assertEqual(Notification.objects.filter(
            user=self.user,
            notification_type="badge_earned"
        ).count(), 1)
        
        self.assertEqual(UserPoints.objects.filter(
            user=self.user,
            source_type="badge"
        ).count(), 1)


class UserPointsTest(TestCase):
    """Test case for the UserPoints model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpassword"
        )
    
    def test_add_points(self):
        """Test adding points to a user."""
        # Add points
        points = UserPoints.add_points(
            user=self.user,
            points=20,
            source_type="place",
            description="Added a place"
        )
        
        # Check that points were added
        self.assertEqual(points.user, self.user)
        self.assertEqual(points.points, 20)
        self.assertEqual(points.source_type, "place")
        
        # Check total points
        total = UserPoints.get_total_points(self.user)
        self.assertEqual(total, 20)
        
        # Add more points
        UserPoints.add_points(
            user=self.user,
            points=10,
            source_type="review",
            description="Added a review"
        )
        
        # Check total points
        total = UserPoints.get_total_points(self.user)
        self.assertEqual(total, 30)
        
        # Check points by source
        place_points = UserPoints.get_points_by_source(self.user, "place")
        self.assertEqual(place_points, 20)
        
        review_points = UserPoints.get_points_by_source(self.user, "review")
        self.assertEqual(review_points, 10)
    
    def test_deduct_points(self):
        """Test deducting points from a user."""
        # Add points
        UserPoints.add_points(
            user=self.user,
            points=50,
            source_type="special",
            description="Initial points"
        )
        
        # Check total points
        total = UserPoints.get_total_points(self.user)
        self.assertEqual(total, 50)
        
        # Deduct points
        points = UserPoints.deduct_points(
            user=self.user,
            points=10,
            source_type="special",
            description="Point deduction"
        )
        
        # Check that points were deducted
        self.assertEqual(points.points, -10)
        
        # Check total points
        total = UserPoints.get_total_points(self.user)
        self.assertEqual(total, 40)


class UserLevelTest(TestCase):
    """Test case for the UserLevel model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpassword"
        )
    
    def test_level_calculation(self):
        """Test that user levels are correctly calculated."""
        # Check initial level
        level = UserLevel.calculate_level(0)
        self.assertEqual(level, 1)
        
        # Check higher levels
        level = UserLevel.calculate_level(100)
        self.assertEqual(level, 2)
        
        level = UserLevel.calculate_level(300)
        self.assertEqual(level, 3)
        
        level = UserLevel.calculate_level(700)
        self.assertEqual(level, 4)
        
        level = UserLevel.calculate_level(1500)
        self.assertEqual(level, 5)
        
        level = UserLevel.calculate_level(3000)
        self.assertEqual(level, 6)
        
        level = UserLevel.calculate_level(6000)
        self.assertEqual(level, 7)
        
        # Points in between thresholds
        level = UserLevel.calculate_level(200)
        self.assertEqual(level, 2)
        
        level = UserLevel.calculate_level(699)
        self.assertEqual(level, 3)
    
    def test_level_progress(self):
        """Test that level progress is correctly calculated."""
        # Create a fresh user for this test
        test_user = User.objects.create_user(
            username="leveluser",
            email="level@example.com",
            password="testpassword"
        )
        
        # Clean up any existing UserLevel objects for this user
        UserLevel.objects.filter(user=test_user).delete()
        
        # Create UserLevel explicitly at level 1
        user_level = UserLevel.objects.create(
            user=test_user,
            level=1
        )
        
        # Add points to reach level 2 (threshold is 100)
        points = UserPoints.objects.create(
            user=test_user,
            points=110,
            source_type="special",
            description="Test points"
        )
        
        # Manually check level progress
        level_changed, old_level, new_level = UserLevel.check_level_progress(test_user)
        
        # Level should have changed
        self.assertTrue(level_changed, "Level should have changed from 1 to 2")
        self.assertEqual(old_level, 1, "Old level should be 1")
        self.assertEqual(new_level, 2, "New level should be 2")
        
        # User level should be updated in database
        user_level.refresh_from_db()
        self.assertEqual(user_level.level, 2, "UserLevel in database should be updated to 2")
        
        # A notification should have been created
        notification = Notification.objects.filter(
            user=test_user,
            notification_type="level_up"
        ).first()
        
        self.assertIsNotNone(notification, "Level up notification should be created")
        self.assertIn("Level 2", notification.title, "Notification should mention Level 2")


class BadgeAPITest(APITestCase):
    """Test cases for the badge API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.user = get_user_model().objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword'
        )
        
        # Create some test badges
        self.badge1 = Badge.objects.create(
            name="Test Badge 1",
            description="Test description 1",
            type="place_contribution",
            level="bronze",
            requirement_code="first_place",
            requirement_description="Add a place that gets approved",
            points=10
        )
        
        self.badge2 = Badge.objects.create(
            name="Test Badge 2",
            description="Test description 2",
            type="review_contribution",
            level="silver",
            requirement_code="first_review",
            requirement_description="Write a review that gets approved",
            points=20
        )
        
        # Create a user badge
        self.user_badge = UserBadge.objects.create(
            user=self.user,
            badge=self.badge1
        )
        
        # Add points for the user
        UserPoints.add_points(
            user=self.user,
            points=20,
            source_type="place",
            description="Added a place"
        )
        
        UserPoints.add_points(
            user=self.user,
            points=10,
            source_type="review",
            description="Added a review"
        )
        
        # Create user level
        self.user_level, _ = UserLevel.objects.get_or_create(
            user=self.user,
            defaults={'level': 1}
        )
        
        self.client = APIClient()
    
    def test_badge_list(self):
        """Test listing all badges."""
        url = reverse('badge-list')
        self.client.force_authenticate(user=self.user)
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)  # We created exactly 2 badges
    
    def test_user_badge_list(self):
        """Test listing user badges."""
        url = reverse('user-badge-list')
        self.client.force_authenticate(user=self.user)
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)  # We created exactly 1 user badge
    
    def test_user_points_list(self):
        """Test listing user points."""
        url = reverse('user-points-list')
        self.client.force_authenticate(user=self.user)
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)  # We created exactly 2 point entries
    
    def test_user_points_summary(self):
        """Test user points summary."""
        self.client.force_authenticate(user=self.user)
        url = reverse('user-points-summary')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_points'], 30)
        self.assertEqual(len(response.data['points_by_source']), 2)
        self.assertEqual(response.data['level']['level'], 1)
    
    def test_user_level(self):
        """Test retrieving user level."""
        self.client.force_authenticate(user=self.user)
        url = reverse('user-level-detail', args=[self.user.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check that the response has the right fields
        self.assertEqual(response.data['level'], 1)
        self.assertEqual(response.data['user'], self.user.id)
        self.assertIn('next_level_threshold', response.data)
        self.assertIn('progress_percentage', response.data)
        self.assertIn('title', response.data)
    
    def test_check_eligibility(self):
        """Test the check eligibility endpoint."""
        self.client.force_authenticate(user=self.user)
        
        # Create an approved place so the user should be eligible for the first review badge
        place = Place.objects.create(
            name="Test Place",
            type="restaurant",
            price_range="1000",
            user=self.user,
            moderation_status="APPROVED"
        )
        
        review = Review.objects.create(
            place=place,
            user=self.user,
            overall_rating=4,
            food_rating=4,
            service_rating=4,
            value_rating=4,
            comment="This is a test review",
            moderation_status="APPROVED"
        )
        
        url = reverse('user-badge-check-eligibility')
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['new_badges_count'], 1)
        self.assertEqual(response.data['new_badges'][0]['badge_details']['name'], 'Test Badge 2')
        
        # Check that the badge was awarded
        user_badge = UserBadge.objects.filter(
            user=self.user,
            badge=self.badge2
        ).first()
        
        self.assertIsNotNone(user_badge)
        
        # Check that points were awarded
        badge_points = UserPoints.objects.filter(
            user=self.user,
            source_type="badge",
            source_id=self.badge2.id
        ).first()
        
        self.assertIsNotNone(badge_points)
        self.assertEqual(badge_points.points, 20)
    
    def test_user_profile(self):
        """Test the user profile endpoint."""
        self.client.force_authenticate(user=self.user)
        url = reverse('user-profile-detail', args=[self.user.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check that the response has the right fields
        self.assertEqual(response.data['email'], 'test@example.com')
        self.assertIn('badges', response.data)
        self.assertIn('level', response.data)
        self.assertIn('total_points', response.data)
        self.assertIn('badge_count', response.data) 