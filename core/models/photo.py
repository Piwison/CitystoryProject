from django.db import models
from django.conf import settings
from model_utils import FieldTracker
from .mixins import TimestampMixin, ModerationMixin

class Photo(TimestampMixin, ModerationMixin):
    MODERATION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    place = models.ForeignKey('core.Place', on_delete=models.CASCADE, related_name='photos')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='photos')
    image = models.ImageField(upload_to='place_photos/')
    caption = models.CharField(max_length=255, blank=True)

    # Track changes to moderation_status
    tracker = FieldTracker(['moderation_status'])

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Photo by {self.user.email} for {self.place.name}' 