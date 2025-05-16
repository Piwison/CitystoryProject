from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from model_utils import FieldTracker
from .mixins import TimestampMixin, ModerationMixin

class Review(TimestampMixin, ModerationMixin):
    MODERATION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    place = models.ForeignKey('core.Place', on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    
    # Overall rating is required for all places
    overall_rating = models.FloatField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    
    # Specific ratings that might be required based on place type
    food_rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    service_rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    value_rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    cleanliness_rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    
    # Review content
    comment = models.TextField()
    helpful_count = models.PositiveIntegerField(default=0)
    
    # Track changes to moderation_status
    tracker = FieldTracker(['moderation_status'])

    class Meta:
        ordering = ['-created_at']
        unique_together = ['place', 'user']  # One review per user per place
        indexes = [
            models.Index(fields=['helpful_count']),
        ]

    def __str__(self):
        return f'Review by {self.user.email} for {self.place.name}'
        
    def save(self, *args, **kwargs):
        """
        Override save to update place ratings when a review is created/updated.
        """
        super().save(*args, **kwargs)
        
        # Only update place rating if this review is approved
        if self.moderation_status == 'approved':
            self.place.update_average_ratings() 