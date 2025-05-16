from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from core.models.place import Place
from core.models.review import Review
from core.models.notification import Notification
from core.tasks import send_notification_email

User = get_user_model()

class Command(BaseCommand):
    help = 'Test email functionality by sending a test notification email'

    def handle(self, *args, **options):
        try:
            # Create a test user if it doesn't exist
            user, created = User.objects.get_or_create(
                email='testuser@example.com',
                defaults={
                    'first_name': 'Test',
                    'last_name': 'User',
                }
            )
            if created:
                user.set_password('testpass123')
                user.save()
                self.stdout.write(self.style.SUCCESS('Created test user'))

            # Create a test place if it doesn't exist
            place, created = Place.objects.get_or_create(
                name='Test Place',
                defaults={
                    'category': 'restaurant',
                    'address': '123 Test St',
                    'user': user,
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS('Created test place'))

            # Create a test review if it doesn't exist
            review, created = Review.objects.get_or_create(
                place=place,
                user=user,
                defaults={
                    'rating': 4,
                    'text': 'Great place!',
                    'moderation_status': 'pending',
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS('Created test review'))

            # Create a test notification
            notification = Notification.objects.create(
                user=user,
                notification_type='review_approved',
                title='Your Review Has Been Approved!',
                message=f'Your review for "{place.name}" has been approved.',
                content_type=ContentType.objects.get_for_model(review),
                object_id=review.id
            )
            self.stdout.write(self.style.SUCCESS('Created test notification'))

            # Send the notification email
            send_notification_email(notification.id)
            self.stdout.write(self.style.SUCCESS('Test email sent successfully'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}')) 