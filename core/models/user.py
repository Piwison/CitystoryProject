from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """
    Custom user model for the application.
    Matches the User model in Prisma schema.
    """
    # OAuth related fields
    google_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    auth_type = models.CharField(
        max_length=10,
        choices=[
            ('LOCAL', 'Local'),
            ('GOOGLE', 'Google'),
        ],
        default='LOCAL'
    )
    
    # Profile fields
    avatar = models.CharField(max_length=255, null=True, blank=True, help_text="Profile image URL")
    bio = models.TextField(blank=True, null=True, help_text="Short user description")
    location = models.CharField(max_length=255, null=True, blank=True, help_text="User's current location (city/country)")
    
    # Guide system
    guide_points = models.IntegerField(default=0, help_text="Points earned for contributions")
    guide_level = models.IntegerField(default=1, help_text="Level based on points")
    is_verified = models.BooleanField(default=False)
    
    # Status and timestamps
    status = models.CharField(
        max_length=20,
        choices=[
            ('ACTIVE', 'Active'),
            ('SUSPENDED', 'Suspended'),
            ('DELETED', 'Deleted'),
        ],
        default='ACTIVE'
    )
    name = models.CharField(max_length=255, null=True, blank=True)
    last_login = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'auth_user'
        
    def __str__(self):
        return self.username or self.email 