from django.db import models
from django.conf import settings
from django.utils import timezone
from .mixins import TimestampMixin
from django.contrib.contenttypes.models import ContentType
import uuid

class UserBadge(TimestampMixin):
    """
    Represents a badge earned by a user.
    Matches the UserBadge model in Prisma schema.
    """
    id = models.CharField(max_length=128, primary_key=True, default=uuid.uuid4)  # Use uuid4 as default
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='user_badges')
    badge = models.ForeignKey('Badge', on_delete=models.CASCADE, related_name='user_badges')
    level = models.PositiveIntegerField(default=1)
    earned_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        unique_together = ['user', 'badge']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['badge']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.badge.name}"
    
    @classmethod
    def award_badge(cls, user, badge):
        """
        Award a badge to a user if they don't already have it.
        
        Args:
            user: User to award the badge to
            badge: Badge to award
            
        Returns:
            Tuple of (UserBadge instance, whether it was created)
        """
        from .notification import Notification
        from .user_points import UserPoints
        
        # Check if the user already has this badge
        user_badge, created = cls.objects.get_or_create(
            user=user,
            badge=badge
        )
        
        # If the badge was just created, create a notification and award points
        if created:
            # Create a notification without using content_type and object_id
            # since badge IDs are UUIDs which don't work with PositiveIntegerField
            Notification.objects.create(
                user=user,
                notification_type='badge_earned',
                title=f'New Badge Earned: {badge.name}!',
                message=(
                    f'Congratulations! You\'ve earned the badge: '
                    f'{badge.name}. {badge.description}'
                )
            )
            
            # Award points for the badge (fixed value since badge.points no longer exists)
            UserPoints.add_points(
                user=user,
                points=10,  # Default points value for badges
                source_type='badge',
                source_id=badge.id,
                description=f"Earned the {badge.name} badge"
            )
                
        return user_badge, created 