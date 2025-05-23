from django.db import models
from django.conf import settings
from model_utils import FieldTracker
from .mixins import TimestampMixin, ModerationMixin
import uuid

class PlacePhoto(TimestampMixin, ModerationMixin):
    """
    Photo model for places.
    Matches the PlacePhoto model in Prisma schema.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)  # Updated from CharField
    place = models.ForeignKey('core.Place', on_delete=models.CASCADE, related_name='photos')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='photos')
    url = models.CharField(max_length=255, help_text="URL to the photo")
    caption = models.CharField(max_length=255, blank=True, null=True)
    is_primary = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    # Track changes to moderation_status
    tracker = FieldTracker(['moderation_status'])

    class Meta:
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['is_primary']),
            models.Index(fields=['place']),
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f'Photo by {self.user.email} for {self.place.name}' 