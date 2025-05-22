from django.db import models
from django.conf import settings
from .mixins import TimestampMixin

class SavedPlace(TimestampMixin):
    """
    Represents a Place saved/bookmarked by a User.
    Matches the SavedPlace model in Prisma schema.
    """
    id = models.CharField(max_length=128, primary_key=True)  # Matching cuid field from Prisma
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='saved_places')
    place = models.ForeignKey('core.Place', on_delete=models.CASCADE, related_name='saved_by')
    notes = models.TextField(blank=True, null=True)
    savedAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'place']  # A user can save a place only once
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['place']),
        ]

    def __str__(self):
        return f"{self.user.username} saved {self.place.name}" 