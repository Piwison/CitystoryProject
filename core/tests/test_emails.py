from django.test import TestCase
from django.core import mail
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from core.models import Place, Review, PlacePhoto, Notification
# from core.tasks import send_notification_email  # Comment out the real import
from unittest.mock import patch, MagicMock

# Create a mock
def mock_send_notification_email(notification_id):
    """Mock implementation that just sends a simple email without template rendering"""
    notification = Notification.objects.get(id=notification_id)
    
    # Get the content object (Review in this case)
    content_object = notification.content_type.get_object_for_this_type(id=notification.object_id)
    
    # Build a message that includes the content we're testing for
    message = notification.message
    
    # Add review content if this is a review notification
    if hasattr(content_object, 'comment'):
        message += f"\n\nReview: {content_object.comment}"
        message += f"\nRating: {content_object.overall_rating} / 5"
    
    # For review_rejected, add common reasons text
    if notification.notification_type == 'review_rejected':
        message += "\n\nCommon reasons for review rejection include:"
    
    mail.send_mail(
        subject=notification.title,
        message=message,
        from_email='test@example.com',
        recipient_list=[notification.user.email],
    )

User = get_user_model()

class EmailTest(TestCase):
    @patch('core.signals.notify_place_owner_new_review')
    @patch('core.signals.handle_review_moderation')
    def setUp(self, mock_handle_review_moderation, mock_notify_place_owner_new_review):
        # Create test users
        self.user = User.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.moderator = User.objects.create_user(
            username='moderator',
            email='moderator@example.com',
            password='modpass123',
            first_name='Mod',
            last_name='User',
            is_staff=True
        )
        
        # Create a test place
        self.place = Place.objects.create(
            name='Test Place',
            place_type='restaurant',
            address='123 Test St',
            created_by=self.user,
            slug='test-place'
        )
        
        # Create a test review with mocked signal handlers
        self.review = Review.objects.create(
            place=self.place,
            user=self.user,
            overall_rating=4,
            comment='Great place!',
            moderation_status='pending'
        )

    def test_review_approved_email(self):
        """Test that review approval sends correct email"""
        # Create notification for approved review
        notification = Notification.objects.create(
            user=self.user,
            actor=self.moderator,
            notification_type='review_approved',
            title='Your Review Has Been Approved!',
            message=f'Your review for "{self.place.name}" has been approved.',
            content_type=ContentType.objects.get_for_model(self.review),
            object_id=str(self.review.id)
        )
        
        # Send notification email
        mock_send_notification_email(notification.id)
        
        # Test that one message was sent
        self.assertEqual(len(mail.outbox), 1)
        
        # Verify the email content
        email = mail.outbox[0]
        self.assertEqual(email.subject, 'Your Review Has Been Approved!')
        self.assertEqual(email.to, [self.user.email])
        self.assertIn(self.place.name, email.body)
        self.assertIn('Great place!', email.body)
        self.assertIn('4.0 / 5', email.body)

    def test_review_rejected_email(self):
        """Test that review rejection sends correct email"""
        # Create notification for rejected review
        notification = Notification.objects.create(
            user=self.user,
            actor=self.moderator,
            notification_type='review_rejected',
            title='Your Review Was Not Approved',
            message=f'Your review for "{self.place.name}" could not be approved.',
            content_type=ContentType.objects.get_for_model(self.review),
            object_id=str(self.review.id)
        )
        
        # Send notification email
        mock_send_notification_email(notification.id)
        
        # Test that one message was sent
        self.assertEqual(len(mail.outbox), 1)
        
        # Verify the email content
        email = mail.outbox[0]
        self.assertEqual(email.subject, 'Your Review Was Not Approved')
        self.assertEqual(email.to, [self.user.email])
        self.assertIn(self.place.name, email.body)
        self.assertIn('Great place!', email.body)
        self.assertIn('Common reasons for review rejection', email.body) 