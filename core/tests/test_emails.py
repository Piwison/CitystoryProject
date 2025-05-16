from django.test import TestCase
from django.core import mail
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from core.models import Place, Review, Photo, Notification
from core.tasks import send_notification_email

User = get_user_model()

class EmailTest(TestCase):
    def setUp(self):
        # Create test users
        self.user = User.objects.create_user(
            email='testuser@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.moderator = User.objects.create_user(
            email='moderator@example.com',
            password='modpass123',
            first_name='Mod',
            last_name='User',
            is_staff=True
        )
        
        # Create a test place
        self.place = Place.objects.create(
            name='Test Place',
            category='restaurant',
            address='123 Test St',
            user=self.user
        )
        
        # Create a test review
        self.review = Review.objects.create(
            place=self.place,
            user=self.user,
            rating=4,
            text='Great place!',
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
            object_id=self.review.id
        )
        
        # Send notification email
        send_notification_email(notification.id)
        
        # Test that one message was sent
        self.assertEqual(len(mail.outbox), 1)
        
        # Verify the email content
        email = mail.outbox[0]
        self.assertEqual(email.subject, 'Your Review Has Been Approved!')
        self.assertEqual(email.to, [self.user.email])
        self.assertIn(self.place.name, email.body)
        self.assertIn('Great place!', email.body)
        self.assertIn('4 / 5', email.body)

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
            object_id=self.review.id
        )
        
        # Send notification email
        send_notification_email(notification.id)
        
        # Test that one message was sent
        self.assertEqual(len(mail.outbox), 1)
        
        # Verify the email content
        email = mail.outbox[0]
        self.assertEqual(email.subject, 'Your Review Was Not Approved')
        self.assertEqual(email.to, [self.user.email])
        self.assertIn(self.place.name, email.body)
        self.assertIn('Great place!', email.body)
        self.assertIn('Common reasons for review rejection', email.body) 