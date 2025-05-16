from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('review_approved', 'Review Approved'),
        ('review_rejected', 'Review Rejected'),
        ('photo_approved', 'Photo Approved'),
        ('photo_rejected', 'Photo Rejected'),
        ('place_approved', 'Place Approved'),
        ('place_rejected', 'Place Rejected'),
        ('new_review', 'New Review'),
        ('new_photo', 'New Photo'),
        ('review_helpful', 'Review Helpful'),
        # New notification types for badges and levels
        ('badge_earned', 'Badge Earned'),
        ('level_up', 'Level Up'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='actions')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    email_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Generic relation to the content object (Review, Photo, Place)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['notification_type']),
            models.Index(fields=['is_read']),
        ]

    def __str__(self):
        return f"{self.notification_type} for {self.user.email}"

    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.save(update_fields=['is_read', 'updated_at'])
            
    @classmethod
    def create_content_notification(cls, content_obj, notification_type):
        """Create a notification for content-related events."""
        from django.contrib.contenttypes.models import ContentType
        
        # Determine the user to notify
        if hasattr(content_obj, 'user'):
            user = content_obj.user
        elif hasattr(content_obj, 'uploader'):
            user = content_obj.uploader
        elif hasattr(content_obj, 'owner'):
            user = content_obj.owner
        else:
            return None
            
        # Set up title and message based on notification type
        object_type = content_obj._meta.verbose_name.title()
        action = notification_type.split('_')[-1].title()
        
        title = f'Your {object_type} Has Been {action}!'
        message = f'Your {object_type.lower()} "{getattr(content_obj, "name", "content")}" has been {notification_type.split("_")[-1]}.'
        
        content_type = ContentType.objects.get_for_model(content_obj)
        
        # Create the notification
        return cls.objects.create(
            user=user,
            notification_type=notification_type,
            title=title,
            message=message,
            content_type=content_type,
            object_id=content_obj.id
        ) 