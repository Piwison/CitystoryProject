from django.db import models
from django.utils import timezone

class TimestampMixin(models.Model):
    """
    Abstract base class mixin that provides self-updating created_at and updated_at fields.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class ModerationMixin(models.Model):
    """
    Abstract base class mixin that provides moderation status field and related functionality.
    """
    MODERATION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    moderation_status = models.CharField(
        max_length=20,
        choices=MODERATION_STATUS_CHOICES,
        default='pending'
    )
    moderated_at = models.DateTimeField(null=True, blank=True)
    moderator = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_moderations'
    )
    moderation_comment = models.TextField(blank=True, default='')

    class Meta:
        abstract = True

    def approve(self, moderator):
        """Approve the content"""
        self.moderation_status = 'approved'
        self.moderated_at = timezone.now()
        self.moderator = moderator
        self.save()

    def reject(self, moderator):
        """Reject the content"""
        self.moderation_status = 'rejected'
        self.moderated_at = timezone.now()
        self.moderator = moderator
        self.save()

    @property
    def is_approved(self):
        """Check if content is approved"""
        return self.moderation_status == 'approved'

    @property
    def is_rejected(self):
        """Check if content is rejected"""
        return self.moderation_status == 'rejected'

    @property
    def is_pending(self):
        """Check if content is pending moderation"""
        return self.moderation_status == 'pending'

    def update_moderation_status(self, status, moderator=None, comment=''):
        """Update moderation status with optional comment"""
        if status not in dict(self.MODERATION_STATUS_CHOICES):
            raise ValueError(f"Invalid status: {status}")
            
        self.moderation_status = status
        self.moderated_at = timezone.now()
        
        if moderator:
            self.moderator = moderator
            
        if comment:
            self.moderation_comment = comment
            
        self.save(update_fields=['moderation_status', 'moderated_at', 'moderator', 'moderation_comment']) 