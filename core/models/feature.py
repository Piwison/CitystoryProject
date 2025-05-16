from django.db import models
from ..choices import PLACE_TYPE_CHOICES, FEATURE_TYPES

class Feature(models.Model):
    """
    Represents a feature or amenity that can be associated with a Place.
    Features are categorized by type (e.g., amenity, cuisine) and can be
    applicable to specific place types.
    """
    name = models.CharField(max_length=100, unique=True)
    type = models.CharField(max_length=50, choices=FEATURE_TYPES, default='other')
    description = models.TextField(blank=True, default='')
    icon = models.CharField(max_length=50, blank=True, null=True)
    
    # Store applicable types as comma-separated string or use JSONField/ArrayField if DB supports
    applicable_place_types = models.CharField(
        max_length=255, 
        blank=True, 
        help_text="Comma-separated list of place types this feature applies to (e.g., 'restaurant,cafe'). Leave blank if applicable to all."
    )

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"

    class Meta:
        ordering = ['type', 'name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['type']),
            models.Index(fields=['applicable_place_types']),
        ]
        # Ensure name+type combination is unique
        unique_together = [['name', 'type']]

    def is_applicable_to_place_type(self, place_type):
        """
        Check if this feature is applicable to the given place type.
        Returns True if applicable_place_types is empty (applicable to all types)
        or if the specific place_type is in the applicable_place_types list.
        """
        if not self.applicable_place_types:
            return True  # Applicable to all if blank
        return place_type in [pt.strip() for pt in self.applicable_place_types.split(',')]

    def get_places_count(self):
        """
        Return the number of places that have this feature.
        """
        return self.places.count()
        
    @classmethod
    def get_by_type(cls, feature_type):
        """
        Get all features of a specific type.
        """
        return cls.objects.filter(type=feature_type)
        
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
        return f"{self.name} ({self.get_type_display()})" 