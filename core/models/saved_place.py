from django.db import models
from django.conf import settings
from .mixins import TimestampMixin
import uuid

class SavedPlace(TimestampMixin):
    """
    Represents a Place saved/bookmarked by a User.
    Matches the SavedPlace model in Prisma schema.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)  # Updated from CharField
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='saved_places')
    place = models.ForeignKey('core.Place', on_delete=models.CASCADE, related_name='saved_by')
    notes = models.TextField(blank=True, null=True)
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'place']  # A user can save a place only once
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['place']),
        ]

    def __str__(self):
        return f"{self.user.username} saved {self.place.name}" 