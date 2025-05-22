from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from model_utils import FieldTracker
from .mixins import TimestampMixin, ModerationMixin

class Review(TimestampMixin, ModerationMixin):
    """
    Review model for places. 
    Matches the Review model in Prisma schema.
    """
    id = models.CharField(max_length=128, primary_key=True, default='')  # Matching cuid field from Prisma
    
    # Relationships
    place = models.ForeignKey('core.Place', on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    
    # Fields matching Prisma schema
    overall_rating = models.FloatField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    food_quality = models.FloatField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    service = models.FloatField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    value = models.FloatField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    cleanliness = models.FloatField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)

    # Review content
    comment = models.TextField(null=True, blank=True)
    helpful_count = models.PositiveIntegerField(default=0) 
    
    # Track changes to moderation_status
    tracker = FieldTracker(['moderation_status'])

    class Meta:
        ordering = ['-created_at']
        unique_together = ['place', 'user']  # One review per user per place
        indexes = [
            models.Index(fields=['helpful_count']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f'Review by {self.user.email} for {self.place.name}'
        
    def save(self, *args, **kwargs):
        """
        Override save to update place ratings when a review is created/updated.
        """
        super().save(*args, **kwargs)
        
        # Only update place rating if this review is approved
        if self.moderation_status == 'APPROVED':
            self.place.update_average_ratings() 