from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from core.models.review import Review
from core.models.photo import Photo
from core.models.place import Place
from core.models.notification import Notification
from core.models.helpful_vote import HelpfulVote
from core.models.user_points import UserPoints
from core.models.badge import Badge
# from .tasks import send_notification_email # Commented out task import as it's not used now

@receiver(post_save, sender=Review)
def handle_review_moderation(sender, instance, created, **kwargs):
    """
    Handle notifications for review moderation status changes
    """
    if not created and instance.tracker.has_changed('moderation_status'):
        notification_type = None
        title = None
        message = None
        
        if instance.moderation_status == 'APPROVED':
            notification_type = 'review_approved'
            title = 'Your Review Has Been Approved!'
            message = f'Your review for "{instance.place.name}" has been approved and is now visible to all users.'
            
            # Award points for approved review
            UserPoints.add_points(
                user=instance.user,
                points=10,
                source_type='review',
                source_id=instance.id,
                description=f"Review for {instance.place.name} approved"
            )
            
        elif instance.moderation_status == 'REJECTED':
            notification_type = 'review_rejected'
            title = 'Your Review Needs Attention'
            
            # Construct a more helpful message with the rejection reason and guidance
            base_message = f'Your review for "{instance.place.name}" requires changes before it can be approved.'
            
            if instance.moderation_comment:
                reason = f"Reason: {instance.moderation_comment}"
            else:
                reason = "Please check our content guidelines for more information."
                
            guidance = "You can edit your review and resubmit it for approval."
            
            message = f"{base_message}\n\n{reason}\n\n{guidance}"
        
        if notification_type:
            notification = Notification.objects.create(
                user=instance.user,
                notification_type=notification_type,
                title=title,
                message=message,
                content_type=ContentType.objects.get_for_model(instance),
                object_id=instance.id
            )
            # send_notification_email.delay(notification.id) # MVP: Disabled email sending

@receiver(post_save, sender=Photo)
def handle_photo_moderation(sender, instance, created, **kwargs):
    """
    Handle notifications for photo moderation status changes
    """
    if not created and instance.tracker.has_changed('moderation_status'):
        notification_type = None
        title = None
        message = None
        
        if instance.moderation_status == 'APPROVED':
            notification_type = 'photo_approved'
            title = 'Your Photo Has Been Approved!'
            message = f'Your photo for "{instance.place.name}" has been approved and is now visible to all users.'
            
            # Award points for approved photo
            UserPoints.add_points(
                user=instance.user,
                points=5,
                source_type='photo',
                source_id=instance.id,
                description=f"Photo for {instance.place.name} approved"
            )
            
        elif instance.moderation_status == 'REJECTED':
            notification_type = 'photo_rejected'
            title = 'Your Photo Needs Attention'
            
            # Construct a more helpful message with the rejection reason and guidance
            base_message = f'Your photo for "{instance.place.name}" requires changes before it can be approved.'
            
            if instance.moderation_comment:
                reason = f"Reason: {instance.moderation_comment}"
            else:
                reason = "Please check our content guidelines for more information."
                
            guidance = "You can upload a new photo or remove this one from your uploads."
            
            message = f"{base_message}\n\n{reason}\n\n{guidance}"
        
        if notification_type:
            notification = Notification.objects.create(
                user=instance.user,
                notification_type=notification_type,
                title=title,
                message=message,
                content_type=ContentType.objects.get_for_model(instance),
                object_id=instance.id
            )
            # send_notification_email.delay(notification.id) # MVP: Disabled email sending

@receiver(post_save, sender=Place)
def handle_place_moderation(sender, instance, created, **kwargs):
    """
    Handle notifications and points for place moderation status changes
    """
    if not created and instance.tracker.has_changed('moderation_status'):
        notification_type = None
        title = None
        message = None
        
        if instance.moderation_status == 'APPROVED':
            notification_type = 'place_approved'
            title = 'Your Place Has Been Approved!'
            message = f'Your place "{instance.name}" has been approved and is now visible to all users.'
            
            # Award points for approved place
            UserPoints.add_points(
                user=instance.user,
                points=20,
                source_type='place',
                source_id=instance.id,
                description=f"Place {instance.name} approved"
            )
            
        elif instance.moderation_status == 'REJECTED':
            notification_type = 'place_rejected'
            title = 'Your Place Needs Attention'
            
            # Construct a more helpful message with the rejection reason and guidance
            base_message = f'Your place "{instance.name}" requires changes before it can be approved.'
            
            if instance.moderation_comment:
                reason = f"Reason: {instance.moderation_comment}"
            else:
                reason = "Please check our content guidelines for more information."
                
            guidance = "You can edit the place details and resubmit for approval."
            
            message = f"{base_message}\n\n{reason}\n\n{guidance}"
        
        if notification_type:
            notification = Notification.objects.create(
                user=instance.user,
                notification_type=notification_type,
                title=title,
                message=message,
                content_type=ContentType.objects.get_for_model(instance),
                object_id=instance.id
            )
            # send_notification_email.delay(notification.id) # MVP: Disabled email sending

@receiver(post_save, sender=Review)
def notify_place_owner_new_review(sender, instance, created, **kwargs):
    """
    Notify place owner when a new review is posted
    """
    if created and instance.place.user:
        notification = Notification.objects.create(
            user=instance.place.user,
            actor=instance.user,
            notification_type='new_review',
            title='New Review for Your Place',
            message=f'A new review has been posted for "{instance.place.name}"',
            content_type=ContentType.objects.get_for_model(instance),
            object_id=instance.id
        )
        # Send email asynchronously
        # send_notification_email.delay(notification.id) # MVP: Disabled email sending

@receiver(post_save, sender=Photo)
def notify_place_owner_new_photo(sender, instance, created, **kwargs):
    """
    Notify place owner when a new photo is uploaded
    """
    if created and instance.place.user:
        notification = Notification.objects.create(
            user=instance.place.user,
            actor=instance.user,
            notification_type='new_photo',
            title='New Photo for Your Place',
            message=f'A new photo has been uploaded for "{instance.place.name}"',
            content_type=ContentType.objects.get_for_model(instance),
            object_id=instance.id
        )
        # Send email asynchronously
        # send_notification_email.delay(notification.id) # MVP: Disabled email sending 

@receiver(post_save, sender=HelpfulVote)
def handle_helpful_vote(sender, instance, created, **kwargs):
    """
    Award points when a user receives a helpful vote on their review
    """
    if created:
        # Award 2 points to the review author for getting a helpful vote
        review = instance.review
        
        UserPoints.add_points(
            user=review.user,
            points=2,
            source_type='helpful_vote',
            source_id=instance.id,
            description=f"Helpful vote on review for {review.place.name}"
        ) 