from django.db import models
from ..choices import PLACE_TYPE_CHOICES, FEATURE_TYPES
import uuid

class Feature(models.Model):
    """
    Represents a feature or amenity that can be associated with a Place.
    Matches the Feature model in Prisma schema.
    """
    id = models.CharField(max_length=128, primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=255)
    icon = models.CharField(max_length=255, null=True, blank=True)
    feature_type = models.CharField(max_length=50, help_text="Category type: amenity, cuisine, etc.")

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['feature_type']),
        ]

    def __str__(self):
        return f"{self.name} ({self.feature_type})"

    @classmethod
    def get_by_type(cls, feature_type):
        """
        Get all features of a specific type.
        """
        return cls.objects.filter(feature_type=feature_type)

    def is_applicable_to_place_type(self, place_type):
        """
        Check if this feature is applicable to the given place type.
        With the removal of applicable_place_types field, all features are applicable to all place types.
        """
        return True  # All features are applicable to all place types now

class PlaceFeature(models.Model):
    """
    Junction table for Place and Feature.
    Matches the PlaceFeature model in Prisma schema.
    """
    id = models.CharField(max_length=128, primary_key=True, default=uuid.uuid4)  # Use uuid4 as default
    place = models.ForeignKey('core.Place', on_delete=models.CASCADE, related_name='place_features')
    feature = models.ForeignKey(Feature, on_delete=models.CASCADE, related_name='place_features')
    
    class Meta:
        unique_together = ['place', 'feature']
        indexes = [
            models.Index(fields=['place']),
            models.Index(fields=['feature']),
        ]
        
    def __str__(self):
        return f"{self.place.name} - {self.feature.name}"

    def is_applicable_to_place_type(self, place_type):
        """
        Check if this feature is applicable to the given place type.
        With the removal of applicable_place_types field, all features are applicable to all place types.
        """
        return True  # All features are applicable to all place types now

    def get_places_count(self):
        """
        Return the number of places that have this feature.
        """
        return self.place_features.count()
        
    @classmethod
    def get_types(cls):
        """
        Get a list of all feature types.
        """
        return [t[0] for t in FEATURE_TYPES]

    @property
    def display_name(self):
        """
        Return a formatted display name including the type.
        """
        return f"{self.name} ({self.feature_type})" 