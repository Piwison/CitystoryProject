from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from .place import Place

class SavedPlace(models.Model):
    """
    Represents a place that a user has saved to their collection.
    Users can save places for later reference and add personal notes.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='saved_places'
    )
    place = models.ForeignKey(
        Place,
        on_delete=models.CASCADE,
        related_name='saved_by'
    )
    notes = models.TextField(
        blank=True,
        default='',
        help_text=_("User's personal notes about this place")
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'place']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['place']),
            models.Index(fields=['created_at']),
        ]
        
    def __str__(self):
        return f"{self.place.name} saved by {self.user.email}" 