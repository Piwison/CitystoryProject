from django.db import models
from .mixins import TimestampMixin
from django.db.models import Count, Sum
from django.utils import timezone
import uuid

class Badge(TimestampMixin):
    """
    Model representing achievement badges that users can earn.
    Matches the Badge model in Prisma schema.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)  # Updated from CharField
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=255)
    description = models.TextField()
    max_level = models.PositiveIntegerField(default=1)
    category = models.CharField(max_length=100)
    
    class Meta:
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['category']),
        ]
    
    def __str__(self):
        return self.name
    
    @classmethod
    def check_eligibility(cls, user):
        """
        Check if a user is eligible for any badges they don't already have.
        
        Args:
            user: User to check
            
        Returns:
            List of Badge objects the user is eligible for
        """
        # Get all badges
        all_badges = cls.objects.all()
        
        # Get badges the user already has
        user_badge_ids = user.user_badges.values_list('badge_id', flat=True)
        
        # Filter out badges the user already has
        eligible_badges = []
        
        for badge in all_badges:
            # Skip if user already has this badge
            if badge.id in user_badge_ids:
                continue
                
            # Handle common badge name patterns for requirement method lookup
            name = badge.name.lower()
            
            # First try direct conversion (lowercase with underscores)
            requirement_code = name.replace(' ', '_')
            
            # Also try without 'badge' in the name
            if 'badge' in requirement_code:
                requirement_code = requirement_code.replace('_badge', '')
            
            # Check if there's a level indicator (bronze, silver, gold)
            level_indicators = ['bronze', 'silver', 'gold']
            base_name = None
            for level in level_indicators:
                if level in requirement_code:
                    base_name = requirement_code.replace(f'_{level}', '')
                    requirement_code = f"{base_name}_{level}"
                    break
                
            # Try different variants of the method name
            method_variants = [
                f"check_{requirement_code}",
                f"check_{base_name}" if base_name else None
            ]
            
            # Try to find the appropriate check method
            for method_name in method_variants:
                if not method_name:
                    continue
                    
                requirement_check_method = getattr(
                    cls.BadgeRequirementChecker,
                    method_name,
                    None
                )
                
                if requirement_check_method and requirement_check_method(user):
                    eligible_badges.append(badge)
                    break
        
        return eligible_badges
    
    class BadgeRequirementChecker:
        """
        Class containing static methods to check badge requirements.
        Each method should be named check_<requirement_code> and accept a user parameter.
        """
        
        @staticmethod
        def check_first_place(user):
            """Check if user has added at least one approved place."""
            from .place import Place
            return Place.objects.filter(
                created_by=user, 
                moderation_status='APPROVED'
            ).exists()
        
        @staticmethod
        def check_prolific_creator(user):
            """Check if user has added at least 5 approved places."""
            from .place import Place
            return Place.objects.filter(
                created_by=user, 
                moderation_status='APPROVED'
            ).count() >= 5
        
        @staticmethod
        def check_place_master(user):
            """Check if user has added at least 20 approved places."""
            from .place import Place
            return Place.objects.filter(
                created_by=user, 
                moderation_status='APPROVED'
            ).count() >= 20
        
        @staticmethod
        def check_first_review(user):
            """Check if user has written at least one approved review."""
            return user.reviews.filter(moderation_status='APPROVED').exists()
        
        @staticmethod
        def check_review_enthusiast(user):
            """Check if user has written at least 10 approved reviews."""
            return user.reviews.filter(moderation_status='APPROVED').count() >= 10
        
        @staticmethod
        def check_review_expert(user):
            """Check if user has written at least 30 approved reviews."""
            return user.reviews.filter(moderation_status='APPROVED').count() >= 30
        
        @staticmethod
        def check_first_photo(user):
            """Check if user has uploaded at least one approved photo."""
            return user.photo_uploads.filter(moderation_status='APPROVED').exists()
        
        @staticmethod
        def check_photographer(user):
            """Check if user has uploaded at least 10 approved photos."""
            return user.photo_uploads.filter(moderation_status='APPROVED').count() >= 10
        
        @staticmethod
        def check_photo_journalist(user):
            """Check if user has uploaded at least 30 approved photos."""
            return user.photo_uploads.filter(moderation_status='APPROVED').count() >= 30
        
        @staticmethod
        def check_helpful_reviewer_bronze(user):
            """Check if user has received at least 5 helpful votes on their reviews."""
            from .review import Review
            
            # Sum helpful_count across all user's reviews
            total_helpful = Review.objects.filter(
                user=user
            ).aggregate(
                total_helpful=Sum('helpful_count')
            )['total_helpful'] or 0
            
            return total_helpful >= 5
        
        @staticmethod
        def check_helpful_reviewer_silver(user):
            """Check if user has received at least 25 helpful votes on their reviews."""
            from .review import Review
            
            # Sum helpful_count across all user's reviews
            total_helpful = Review.objects.filter(
                user=user
            ).aggregate(
                total_helpful=Sum('helpful_count')
            )['total_helpful'] or 0
            
            return total_helpful >= 25
        
        @staticmethod
        def check_helpful_reviewer_gold(user):
            """Check if user has received at least 100 helpful votes on their reviews."""
            from .review import Review
            
            # Sum helpful_count across all user's reviews
            total_helpful = Review.objects.filter(
                user=user
            ).aggregate(
                total_helpful=Sum('helpful_count')
            )['total_helpful'] or 0
            
            return total_helpful >= 100
        
        @staticmethod
        def check_one_month_active(user):
            """Check if user has been active for at least one month."""
            from datetime import timedelta
            
            one_month_ago = timezone.now() - timedelta(days=30)
            return user.date_joined <= one_month_ago
        
        @staticmethod
        def check_six_months_active(user):
            """Check if user has been active for at least six months."""
            from datetime import timedelta
            
            six_months_ago = timezone.now() - timedelta(days=182)
            return user.date_joined <= six_months_ago
        
        @staticmethod
        def check_one_year_active(user):
            """Check if user has been active for at least one year."""
            from datetime import timedelta
            
            one_year_ago = timezone.now() - timedelta(days=365)
            return user.date_joined <= one_year_ago
        
        @staticmethod
        def check_places_in_different_cities(user):
            """Check if user has added places in at least 3 different cities."""
            from .place import Place
            
            distinct_cities = Place.objects.filter(
                created_by=user,
                moderation_status='APPROVED'
            ).values('city').distinct().count()
            
            return distinct_cities >= 3
        
        @staticmethod
        def check_different_place_types(user):
            """Check if user has added places of at least 4 different types."""
            from .place import Place
            
            distinct_types = Place.objects.filter(
                created_by=user,
                moderation_status='APPROVED'
            ).values('place_type').distinct().count()
            
            return distinct_types >= 4 