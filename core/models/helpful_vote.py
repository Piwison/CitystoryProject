from django.db import models
from django.conf import settings
from .mixins import TimestampMixin

class HelpfulVote(TimestampMixin):
    """
    Model to track users who have marked reviews as helpful.
    Allows users to toggle their helpful vote and prevents duplicate votes.
    """
    review = models.ForeignKey(
        'core.Review',
        on_delete=models.CASCADE,
        related_name='helpful_votes'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='helpful_votes'
    )
    is_helpful = models.BooleanField(default=True, help_text="Whether the user found the review helpful")
    
    class Meta:
        unique_together = ['review', 'user']  # Each user can only vote once per review
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['review', 'user']),
        ]
        
    def __str__(self):
        return f"{self.user.username} found review {self.review.id} helpful"
        
    @classmethod
    def toggle_vote(cls, review, user):
        """
        Toggle a user's helpful vote on a review.
        Returns a tuple of (vote_added, helpful_count) where vote_added is a boolean
        indicating if a vote was added (True) or removed (False), and helpful_count
        is the new total number of helpful votes.
        """
        try:
            # Try to delete an existing vote
            vote = cls.objects.get(review=review, user=user)
            vote.delete()
            
            # Update the review's helpful_count
            review.helpful_count = models.F('helpful_count') - 1
            review.save(update_fields=['helpful_count'])
            review.refresh_from_db()
            
            return False, review.helpful_count
            
        except cls.DoesNotExist:
            # Create a new vote
            cls.objects.create(review=review, user=user, is_helpful=True)
            
            # Update the review's helpful_count
            review.helpful_count = models.F('helpful_count') + 1
            review.save(update_fields=['helpful_count'])
            review.refresh_from_db()
            
            return True, review.helpful_count 