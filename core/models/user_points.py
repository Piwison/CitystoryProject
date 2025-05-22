from django.db import models
from django.conf import settings
from django.db.models import Sum
from .mixins import TimestampMixin

class UserPoints(TimestampMixin):
    """
    Model for tracking points earned by users.
    Points are awarded for various activities like adding places,
    writing reviews, uploading photos, and earning badges.
    """
    POINT_SOURCES = [
        ('place', 'Place Contribution'),
        ('review', 'Review Contribution'),
        ('photo', 'Photo Contribution'),
        ('helpful_vote', 'Helpful Vote'),
        ('badge', 'Badge Earned'),
        ('special', 'Special Award')
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='points_history'
    )
    points = models.IntegerField(help_text="Number of points (positive for earned, negative for deducted)")
    source_type = models.CharField(max_length=20, choices=POINT_SOURCES)
    source_id = models.PositiveIntegerField(null=True, blank=True, help_text="ID of the object that generated points")
    description = models.CharField(max_length=255)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['source_type']),
            models.Index(fields=['created_at']),
        ]
        verbose_name_plural = 'User Points'
        
    def __str__(self):
        return f"{self.user.email}: {self.points} points for {self.description}"
    
    @classmethod
    def get_total_points(cls, user):
        """Get the total points for a user"""
        total = cls.objects.filter(user=user).aggregate(
            total=Sum('points')
        )['total'] or 0
        return total
    
    @classmethod
    def get_points_by_source(cls, user, source_type):
        """Get points for a user by source type"""
        total = cls.objects.filter(
            user=user, 
            source_type=source_type
        ).aggregate(
            total=Sum('points')
        )['total'] or 0
        return total
    
    @classmethod
    def add_points(cls, user, points, source_type, source_id=None, description=None):
        """
        Add points to a user's account.
        
        Args:
            user: User to add points to
            points: Number of points to add (positive integer)
            source_type: Type of action that generated points
            source_id: Optional ID of the object that generated points (if UUID, will be included in description)
            description: Optional description of the points
        
        Returns:
            UserPoints instance
        """
        if not description:
            # Generate a generic description based on source_type
            source_desc = dict(cls.POINT_SOURCES).get(source_type, source_type)
            description = f"Points for {source_desc}"
        
        # Handle UUID source_id by including it in the description
        numeric_source_id = None
        if source_id:
            try:
                numeric_source_id = int(source_id)
            except (ValueError, TypeError):
                # If source_id is not an integer (e.g., UUID), include it in the description
                description = f"{description} (ID: {source_id})"
        
        # Create the points record
        points_record = cls.objects.create(
            user=user,
            points=points,
            source_type=source_type,
            source_id=numeric_source_id,  # Only use source_id if it's numeric
            description=description
        )
        
        # Update User.guide_points
        user.guide_points = cls.get_total_points(user)
        user.save(update_fields=['guide_points'])
        
        # Check for level changes
        UserLevel.check_level_progress(user)
        
        return points_record
    
    @classmethod
    def deduct_points(cls, user, points, source_type, source_id=None, description=None):
        """
        Deduct points from a user's account.
        
        Args:
            user: User to deduct points from
            points: Number of points to deduct (positive integer)
            source_type: Type of action that resulted in deduction
            source_id: Optional ID of the object related to deduction
            description: Optional description of the deduction
        
        Returns:
            UserPoints instance with negative points
        """
        return cls.add_points(
            user=user,
            points=-abs(points),  # Ensure points are negative
            source_type=source_type,
            source_id=source_id,
            description=description
        )

    @classmethod
    def sync_user_points_and_level(cls, user):
        """Ensure User model guide_points and guide_level match current totals"""
        total_points = cls.get_total_points(user)
        user_level = UserLevel.objects.get_or_create(user=user)[0]
        
        user.guide_points = total_points
        user.guide_level = user_level.level
        user.save(update_fields=['guide_points', 'guide_level'])


class UserLevel(models.Model):
    """
    Model for tracking user levels based on points.
    Users progress through levels as they earn points.
    """
    LEVEL_THRESHOLDS = {
        1: 0,      # Newcomer (0+ points)
        2: 100,    # Explorer (100+ points)
        3: 300,    # Guide (300+ points)
        4: 700,    # Expert (700+ points)
        5: 1500,   # Master (1500+ points)
        6: 3000,   # Connoisseur (3000+ points)
        7: 6000,   # Legend (6000+ points)
    }
    
    LEVEL_TITLES = {
        1: 'Newcomer',
        2: 'Explorer',
        3: 'Guide',
        4: 'Expert',
        5: 'Master',
        6: 'Connoisseur',
        7: 'Legend',
    }
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='user_level'
    )
    level = models.PositiveSmallIntegerField(default=1)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-level']
        indexes = [
            models.Index(fields=['level']),
        ]
        
    def __str__(self):
        return f"{self.user.email} - Level {self.level} ({self.get_level_title()})"
    
    def get_level_title(self):
        """Get the title for the current level"""
        return self.LEVEL_TITLES.get(self.level, f"Level {self.level}")
    
    def get_next_level_threshold(self):
        """Get the points threshold for the next level"""
        next_level = self.level + 1
        return self.LEVEL_THRESHOLDS.get(next_level, None)
    
    def get_progress_to_next_level(self):
        """
        Get the user's progress to the next level as a percentage
        Returns None if user is at max level
        """
        next_threshold = self.get_next_level_threshold()
        if next_threshold is None:
            return None
            
        current_threshold = self.LEVEL_THRESHOLDS.get(self.level, 0)
        total_points = UserPoints.get_total_points(self.user)
        
        points_for_current_level = total_points - current_threshold
        points_needed_for_next_level = next_threshold - current_threshold
        
        if points_needed_for_next_level <= 0:
            return 100
            
        progress = (points_for_current_level / points_needed_for_next_level) * 100
        return min(100, max(0, progress))  # Ensure between 0-100
    
    @classmethod
    def calculate_level(cls, points):
        """Calculate the level for a given number of points"""
        level = 1
        for lvl, threshold in sorted(cls.LEVEL_THRESHOLDS.items()):
            if points >= threshold:
                level = lvl
            else:
                break
        return level
    
    @classmethod
    def check_level_progress(cls, user):
        """
        Check if a user has earned enough points to level up.
        Creates a notification if the user levels up.
        """
        from .notification import Notification
        
        # Get total points
        total_points = UserPoints.get_total_points(user)
        
        # Calculate the level the user should be at
        new_level = cls.calculate_level(total_points)
        
        # Get or create the user's level record
        user_level, created = cls.objects.get_or_create(
            user=user,
            defaults={'level': new_level}
        )
        
        # If not created, check if the user leveled up
        if not created and new_level > user_level.level:
            # Update the user's level
            old_level = user_level.level
            user_level.level = new_level
            user_level.save(update_fields=['level', 'updated_at'])
            
            # Update User.guide_level
            user.guide_level = new_level
            user.save(update_fields=['guide_level'])
            
            # Create a notification for the level up
            Notification.objects.create(
                user=user,
                notification_type='level_up',
                title=f'You Reached Level {new_level}!',
                message=(
                    f'Congratulations! You\'ve reached level {new_level} - {cls.LEVEL_TITLES.get(new_level)}. '
                    f'Keep earning points to unlock more benefits!'
                )
            )
            
            return True, old_level, new_level
            
        elif created:
            # If this is the first time calculating level and it's above 1,
            # create a notification
            if new_level > 1:
                # Update User.guide_level
                user.guide_level = new_level
                user.save(update_fields=['guide_level'])
                
                Notification.objects.create(
                    user=user,
                    notification_type='level_up',
                    title=f'You Reached Level {new_level}!',
                    message=(
                        f'Congratulations! You\'ve reached level {new_level} - {cls.LEVEL_TITLES.get(new_level)}. '
                        f'Keep earning points to unlock more benefits!'
                    )
                )
                return True, 1, new_level
        
        # No level change
        return False, user_level.level, user_level.level 