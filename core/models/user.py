from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """
    Custom user model for the application.
    Extends Django's AbstractUser to allow for future customization.
    """
    # Add custom fields here if needed
    bio = models.TextField(max_length=500, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    
    # OAuth related fields
    google_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    auth_type = models.CharField(
        max_length=10,
        choices=[
            ('local', 'Local'),
            ('google', 'Google'),
        ],
        default='local'
    )
    last_login = models.DateTimeField(auto_now=False, null=True, blank=True)
    
    class Meta:
        db_table = 'auth_user'
        
    def __str__(self):
        return self.username 