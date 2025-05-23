from django.db import models
from django.conf import settings
from django.db.models import Avg
from django.core.validators import URLValidator, MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.utils.text import slugify
from model_utils.fields import StatusField
from model_utils import Choices
from model_utils.tracker import FieldTracker
from .mixins import TimestampMixin, ModerationMixin
from ..choices import PLACE_TYPE_CHOICES, PRICE_LEVEL_CHOICES, DISTRICT_CHOICES
import uuid

class Place(TimestampMixin, ModerationMixin):
    """
    A place that can be reviewed and rated.
    Matches the Place model in Prisma schema.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, blank=True, unique=True, null=True)
    address = models.CharField(max_length=255)
    district = models.CharField(
        max_length=50, 
        choices=DISTRICT_CHOICES, 
        null=True, 
        blank=True,
        help_text="District in Taipei"
    )
    latitude = models.FloatField(null=True, blank=True, help_text="Auto-generated from address")
    longitude = models.FloatField(null=True, blank=True, help_text="Auto-generated from address")
    place_type = models.CharField(max_length=50, choices=PLACE_TYPE_CHOICES)
    avg_rating = models.FloatField(null=True, blank=True)  # Matches avgRating in Prisma
    price_level = models.IntegerField(null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    google_maps_link = models.URLField(max_length=255, validators=[URLValidator()], null=True, blank=True)  # Matches googleMapsLink in Prisma
    
    # Status field is already handled by ModerationMixin (moderation_status)
    contributor_id = models.CharField(max_length=128, null=True, blank=True)  # Matches contributorId in Prisma
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='places', null=True, blank=True)
    
    # Many-to-many relationships
    features = models.ManyToManyField('Feature', related_name='places', blank=True, through='PlaceFeature')
    
    # Extra fields not in Prisma schema but useful for Django
    draft = models.BooleanField(default=True)
    website = models.URLField(max_length=255, validators=[URLValidator()], null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)

    # Track changes to moderation_status
    tracker = FieldTracker(['moderation_status'])

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['created_by']),
            models.Index(fields=['moderation_status']),
            models.Index(fields=['place_type']),
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
        if self.created_by and not self.contributor_id:
            self.contributor_id = self.created_by.id
        
        self.clean()
        
        # Generate slug if it doesn't exist
        if not self.slug:
            self.slug = self.generate_unique_slug()
        
        super().save(*args, **kwargs)

    def calculate_average_rating(self):
        """Calculate the average rating for this place."""
        reviews = self.reviews.filter(moderation_status='APPROVED')
        if not reviews.exists():
            return None
        return reviews.aggregate(Avg('overall_rating'))['overall_rating__avg']

    def update_average_ratings(self):
        """Update average rating based on approved reviews"""
        approved_reviews = self.reviews.filter(moderation_status='APPROVED')
        if not approved_reviews.exists():
            self.avg_rating = 0
        else:
            aggregates = approved_reviews.aggregate(avg_overall=Avg('overall_rating'))
            self.avg_rating = aggregates['avg_overall'] or 0
        self.save()

    def get_features_by_type(self, feature_type):
        """Get all features of a specific type"""
        return self.features.filter(feature_type=feature_type)

    def get_primary_photo(self):
        """Get the primary photo for this place"""
        return self.photos.filter(is_primary=True, moderation_status='APPROVED').first()

    def get_approved_photos(self):
        """Get all approved photos for this place"""
        return self.photos.filter(moderation_status='APPROVED').order_by('-uploaded_at')

    def get_approved_reviews(self):
        """Get all approved reviews for this place"""
        return self.reviews.filter(moderation_status='APPROVED').order_by('-created_at')

    def get_review_count(self):
        """Get the total number of approved reviews"""
        return self.reviews.filter(moderation_status='APPROVED').count()

    def get_absolute_url(self):
        """Get the absolute URL for this place"""
        from django.urls import reverse
        return reverse('place-detail', kwargs={'slug': self.slug})

    @property
    def is_published(self):
        """Check if the place is published (not draft and approved)"""
        return not self.draft and self.moderation_status == 'APPROVED'

    @property
    def has_primary_photo(self):
        """Check if the place has a primary photo"""
        return self.photos.filter(is_primary=True, moderation_status='APPROVED').exists()

    @property
    def rating_summary(self):
        """Get a summary of ratings"""
        return {
            'overall': self.avg_rating,
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