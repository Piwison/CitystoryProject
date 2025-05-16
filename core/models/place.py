from django.db import models
from django.conf import settings
from django.db.models import Avg
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError
from django.utils.text import slugify
from model_utils.fields import StatusField
from model_utils import Choices
from model_utils.tracker import FieldTracker
from .mixins import TimestampMixin, ModerationMixin
from ..choices import PLACE_TYPE_CHOICES, PRICE_RANGE_CHOICES, DISTRICT_CHOICES

class Place(TimestampMixin, ModerationMixin):
    """
    A place that can be reviewed and rated.
    """
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, blank=True, unique=True, null=True)
    description = models.TextField(blank=True, default='')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    type = models.CharField(max_length=50, choices=PLACE_TYPE_CHOICES)
    price_range = models.CharField(
        max_length=10, 
        choices=PRICE_RANGE_CHOICES,
        help_text='Price range in NT$ (0=Free, 200=NT$1-200, 400=NT$200-400, 600=NT$400-600, 800=NT$600-800, 1000=NT$800-1000, 1500=NT$1000-1500, 2000=NT$1500-2000, 2000+=NT$2000+)'
    )
    address = models.CharField(max_length=255, blank=True, default='')
    district = models.CharField(max_length=50, choices=DISTRICT_CHOICES, null=True, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    website = models.URLField(max_length=255, validators=[URLValidator()], null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    features = models.ManyToManyField('Feature', related_name='places', blank=True)
    draft = models.BooleanField(default=True)

    # Aggregate ratings (updated by reviews)
    average_rating = models.FloatField(default=0, help_text='Overall average rating across all dimensions')
    average_food_rating = models.FloatField(default=0, help_text='Average food quality rating')
    average_service_rating = models.FloatField(default=0, help_text='Average service rating')
    average_value_rating = models.FloatField(default=0, help_text='Average value for money rating')
    average_cleanliness_rating = models.FloatField(default=0, help_text='Average cleanliness rating')

    # Track changes to moderation_status
    tracker = FieldTracker(['moderation_status'])

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['slug']),
            models.Index(fields=['type']),
            models.Index(fields=['price_range']),
            models.Index(fields=['district']),
            models.Index(fields=['created_at']),
            models.Index(fields=['latitude', 'longitude']),
        ]

    def __str__(self):
        return self.name
        
    def generate_unique_slug(self):
        """Generate a unique slug for this place"""
        original_slug = slugify(self.name)
        if not original_slug:
            original_slug = 'place'
        
        slug = original_slug
        counter = 1
        
        # Keep checking until we have a unique slug
        while Place.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            slug = f"{original_slug}-{counter}"
            counter += 1
            
        return slug

    def clean(self):
        """Validate the place data"""
        if self.website:
            try:
                URLValidator()(self.website)
            except ValidationError:
                raise ValidationError({'website': 'Enter a valid URL.'})

        # Validate latitude and longitude
        if self.latitude and (self.latitude < -90 or self.latitude > 90):
            raise ValidationError({'latitude': 'Latitude must be between -90 and 90.'})
        if self.longitude and (self.longitude < -180 or self.longitude > 180):
            raise ValidationError({'longitude': 'Longitude must be between -180 and 180.'})

    def save(self, *args, **kwargs):
        """Custom save method"""
        self.clean()
        
        # Generate slug if it doesn't exist
        if not self.slug:
            self.slug = self.generate_unique_slug()
        
        super().save(*args, **kwargs)

    def calculate_average_rating(self):
        """Calculate the average rating for this place."""
        reviews = self.reviews.filter(moderation_status='approved')
        if not reviews.exists():
            return None
        return reviews.aggregate(Avg('overall_rating'))['overall_rating__avg']

    def update_average_ratings(self):
        """Update all average ratings based on approved reviews"""
        approved_reviews = self.reviews.filter(moderation_status='approved')
        if not approved_reviews.exists():
            self.average_rating = 0
            self.average_food_rating = 0
            self.average_service_rating = 0
            self.average_value_rating = 0
            self.average_cleanliness_rating = 0
        else:
            aggregates = approved_reviews.aggregate(
                avg_overall=Avg('overall_rating'),
                avg_food=Avg('food_rating'),
                avg_service=Avg('service_rating'),
                avg_value=Avg('value_rating'),
                avg_cleanliness=Avg('cleanliness_rating')
            )
            self.average_rating = aggregates['avg_overall'] or 0
            self.average_food_rating = aggregates['avg_food'] or 0
            self.average_service_rating = aggregates['avg_service'] or 0
            self.average_value_rating = aggregates['avg_value'] or 0
            self.average_cleanliness_rating = aggregates['avg_cleanliness'] or 0
        self.save()

    def get_features_by_type(self, feature_type):
        """Get all features of a specific type"""
        return self.features.filter(type=feature_type)

    def get_primary_photo(self):
        """Get the primary photo for this place"""
        return self.photos.filter(is_primary=True, moderation_status='approved').first()

    def get_approved_photos(self):
        """Get all approved photos for this place"""
        return self.photos.filter(moderation_status='approved').order_by('order', '-created_at')

    def get_approved_reviews(self):
        """Get all approved reviews for this place"""
        return self.reviews.filter(moderation_status='approved').order_by('-created_at')

    def get_review_count(self):
        """Get the total number of approved reviews"""
        return self.reviews.filter(moderation_status='approved').count()

    def get_absolute_url(self):
        """Get the absolute URL for this place"""
        from django.urls import reverse
        return reverse('place-detail', kwargs={'slug': self.slug})

    @property
    def is_published(self):
        """Check if the place is published (not draft and approved)"""
        return not self.draft and self.moderation_status == 'approved'

    @property
    def has_primary_photo(self):
        """Check if the place has a primary photo"""
        return self.photos.filter(is_primary=True, moderation_status='approved').exists()

    @property
    def rating_summary(self):
        """Get a summary of all ratings"""
        return {
            'overall': self.average_rating,
            'food': self.average_food_rating,
            'service': self.average_service_rating,
            'value': self.average_value_rating,
            'cleanliness': self.average_cleanliness_rating,
            'total_reviews': self.get_review_count()
        }

    @classmethod
    def near(cls, lat, lng, radius_km=5):
        """
        Find places within a given radius of a location.
        Using a simple approximation where 0.01 degree is roughly 1km.
        For complex geodetic calculations, use GeoDjango.
        """
        if not (lat and lng):
            return cls.objects.none()
            
        # Convert radius to approx. degrees (crude approximation for small distances)
        radius_degrees = radius_km * 0.01
        
        return cls.objects.filter(
            latitude__isnull=False,
            longitude__isnull=False,
            latitude__gte=float(lat) - radius_degrees,
            latitude__lte=float(lat) + radius_degrees,
            longitude__gte=float(lng) - radius_degrees,
            longitude__lte=float(lng) + radius_degrees,
        )