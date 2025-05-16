from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from .choices import PLACE_TYPE_CHOICES, PRICE_RANGE_CHOICES

User = get_user_model()

class Place(models.Model):
    """
    Model representing a place (restaurant, cafe, bar, etc.).
    """
    TYPE_CHOICES = PLACE_TYPE_CHOICES
    PRICE_RANGES = PRICE_RANGE_CHOICES
    
    MODERATION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    name = models.CharField(max_length=255)
    description = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    price_range = models.CharField(max_length=5, choices=PRICE_RANGES)
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=2)
    zip_code = models.CharField(max_length=10)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_places')
    features = models.ManyToManyField('Feature', related_name='places', blank=True)
    average_rating = models.FloatField(default=0.0)
    total_reviews = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Moderation fields
    moderation_status = models.CharField(
        max_length=20,
        choices=MODERATION_STATUS_CHOICES,
        default='pending'
    )
    moderation_comment = models.TextField(blank=True)
    moderated_at = models.DateTimeField(null=True, blank=True)
    moderator = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='moderated_places'
    )
    
    def __str__(self):
        return self.name
    
    def update_average_rating(self):
        """Update the average rating based on all approved reviews."""
        reviews = self.reviews.filter(moderation_status='approved')
        if reviews.exists():
            self.average_rating = reviews.aggregate(
                avg_rating=models.Avg('overall_rating')
            )['avg_rating']
            self.total_reviews = reviews.count()
        else:
            self.average_rating = 0.0
            self.total_reviews = 0
        self.save()

class Feature(models.Model):
    """
    Model representing a feature or amenity that a place can have.
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)  # FontAwesome icon name
    
    def __str__(self):
        return self.name

class Review(models.Model):
    """
    Model representing a review of a place.
    """
    MODERATION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    place = models.ForeignKey(Place, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    comment = models.TextField()
    food_rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True
    )
    service_rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True
    )
    value_rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True
    )
    cleanliness_rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True
    )
    overall_rating = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Moderation fields
    moderation_status = models.CharField(
        max_length=20,
        choices=MODERATION_STATUS_CHOICES,
        default='pending'
    )
    moderation_comment = models.TextField(blank=True)
    moderated_at = models.DateTimeField(null=True, blank=True)
    moderator = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='moderated_reviews'
    )
    
    def __str__(self):
        return f'Review by {self.user.email} for {self.place.name}'
    
    def save(self, *args, **kwargs):
        """Calculate overall rating before saving."""
        ratings = [
            r for r in [
                self.food_rating,
                self.service_rating,
                self.value_rating,
                self.cleanliness_rating
            ] if r is not None
        ]
        if ratings:
            self.overall_rating = sum(ratings) / len(ratings)
        super().save(*args, **kwargs)
        
        # Update place's average rating
        self.place.update_average_rating()

class Photo(models.Model):
    """
    Model representing a photo of a place.
    """
    MODERATION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    place = models.ForeignKey(Place, on_delete=models.CASCADE, related_name='photos')
    uploader = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_photos')
    image = models.ImageField(upload_to='place_photos/')
    thumbnail = models.ImageField(upload_to='place_photos/thumbnails/', null=True, blank=True)
    caption = models.CharField(max_length=255, blank=True)
    order = models.PositiveIntegerField(default=0)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Moderation fields
    moderation_status = models.CharField(
        max_length=20,
        choices=MODERATION_STATUS_CHOICES,
        default='pending'
    )
    moderation_comment = models.TextField(blank=True)
    moderated_at = models.DateTimeField(null=True, blank=True)
    moderator = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='moderated_photos'
    )
    
    def __str__(self):
        return f'Photo {self.id} of {self.place.name}'
    
    def save(self, *args, **kwargs):
        """Handle primary photo logic."""
        if self.is_primary:
            # Set all other photos of this place to not primary
            Photo.objects.filter(place=self.place).exclude(id=self.id).update(is_primary=False)
        elif not Photo.objects.filter(place=self.place, is_primary=True).exists():
            # If no primary photo exists, make this one primary
            self.is_primary = True
        super().save(*args, **kwargs)

class Notification(models.Model):
    """
    Model for storing user notifications.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    related_object_type = models.CharField(max_length=50)
    related_object_id = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f'{self.notification_type} for {self.user.email}'
    
    @classmethod
    def create_content_notification(cls, content_obj, notification_type):
        """Create a notification for content-related events."""
        if hasattr(content_obj, 'user'):
            user = content_obj.user
        elif hasattr(content_obj, 'uploader'):
            user = content_obj.uploader
        elif hasattr(content_obj, 'owner'):
            user = content_obj.owner
        else:
            return None
        
        title = f'Content {notification_type.replace("_", " ").title()}'
        message = f'Your {content_obj._meta.verbose_name} has been {notification_type.split("_")[-1]}'
        
        return cls.objects.create(
            user=user,
            notification_type=notification_type,
            title=title,
            message=message,
            related_object_type=content_obj._meta.model_name,
            related_object_id=content_obj.id
        ) 