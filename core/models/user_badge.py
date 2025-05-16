from django.db import models
from django.conf import settings
from .mixins import TimestampMixin
from django.contrib.contenttypes.models import ContentType

class UserBadge(TimestampMixin):
    """
    Model representing badges that have been awarded to users.
    Tracks when badges were earned and creates notifications.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='badges'
    )
    badge = models.ForeignKey(
        'Badge',
        on_delete=models.CASCADE,
        related_name='awarded_to'
    )
    awarded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'badge']
        ordering = ['-awarded_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['badge']),
            models.Index(fields=['awarded_at']),
        ]
        
    def __str__(self):
        return f"{self.user.email} - {self.badge.name}"
    
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
            # Create a notification
            Notification.objects.create(
                user=user,
                notification_type='badge_earned',
                title=f'New Badge Earned: {badge.name}!',
                message=(
                    f'Congratulations! You\'ve earned the {badge.get_level_display()} badge: '
                    f'{badge.name}. {badge.description}'
                ),
                content_type=ContentType.objects.get_for_model(badge),
                object_id=badge.id
            )
            
            # Award points for the badge
            if badge.points > 0:
                UserPoints.add_points(
                    user=user,
                    points=badge.points,
                    source_type='badge',
                    source_id=badge.id,
                    description=f"Earned the {badge.name} badge"
                )
                
        return user_badge, created 