from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from celery import shared_task
from core.models.notification import Notification
from core.models.user import User
from core.models.place import Place
from core.models.review import Review
from core.models.photo import Photo
from core.models.badge import Badge
from core.models.user_badge import UserBadge
from django.utils.html import strip_tags
from datetime import timedelta
from django.utils import timezone
from django.db import models

@shared_task
def send_notification_email(notification_id):
    """
    Send an email for a notification asynchronously
    """
    try:
        notification = Notification.objects.select_related('user', 'actor').get(id=notification_id)
        
        # Get the appropriate email template based on notification type
        template_map = {
            'review_approved': 'emails/review_approved.html',
            'review_rejected': 'emails/review_rejected.html',
            'photo_approved': 'emails/photo_approved.html',
            'photo_rejected': 'emails/photo_rejected.html',
            'place_approved': 'emails/place_approved.html',
            'place_rejected': 'emails/place_rejected.html',
            'new_review': 'emails/new_review.html',
            'new_photo': 'emails/new_photo.html',
            'badge_earned': 'emails/badge_earned.html',
            'level_up': 'emails/level_up.html',
        }
        
        template = template_map.get(notification.notification_type)
        if not template:
            return
            
        # Render email template
        html_message = render_to_string(template, {
            'notification': notification,
            'user': notification.user,
            'actor': notification.actor,
        })
        
        # Strip HTML for plain text version
        plain_message = strip_tags(html_message)
        
        # Send email
        send_mail(
            subject=notification.title,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[notification.user.email],
            html_message=html_message,
        )
        
        # Mark notification as emailed
        notification.email_sent = True
        notification.save(update_fields=['email_sent'])
        
    except Notification.DoesNotExist:
        pass

@shared_task
def send_bulk_notifications(user_ids, title, message, notification_type, actor_id=None):
    """
    Create and send notifications to multiple users
    """
    notifications = []
    for user_id in user_ids:
        notification = Notification.objects.create(
            user_id=user_id,
            actor_id=actor_id,
            title=title,
            message=message,
            notification_type=notification_type
        )
        notifications.append(notification)
        
        # Send email asynchronously
        send_notification_email.delay(notification.id)
    
    return [n.id for n in notifications]

@shared_task
def cleanup_old_notifications(days=30):
    """
    Delete notifications older than specified days
    """
    cutoff_date = timezone.now() - timedelta(days=days)
    Notification.objects.filter(created_at__lt=cutoff_date).delete()

@shared_task
def check_badge_eligibility():
    """
    Scheduled task to check if users are eligible for any badges.
    Runs periodically to award badges based on user activity.
    """
    # Check recently active users first
    recent_activity_cutoff = timezone.now() - timedelta(days=7)
    
    # Get users with recent activity (reviews, places, photos, votes)
    active_users = User.objects.filter(
        models.Q(reviews__created_at__gte=recent_activity_cutoff) |
        models.Q(owned_places__created_at__gte=recent_activity_cutoff) |
        models.Q(photo_uploads__created_at__gte=recent_activity_cutoff) |
        models.Q(helpful_votes__created_at__gte=recent_activity_cutoff) |
        models.Q(saved_places__created_at__gte=recent_activity_cutoff) |
        models.Q(last_login__gte=recent_activity_cutoff)
    ).distinct()
    
    # Track how many badges were awarded
    badge_count = 0
    
    # Check each user for badge eligibility
    for user in active_users:
        eligible_badges = Badge.check_eligibility(user)
        
        # Award eligible badges
        for badge in eligible_badges:
            user_badge, created = UserBadge.award_badge(user, badge)
            if created:
                badge_count += 1
    
    # Also check for longevity badges for all users (less frequently in production)
    longevity_badges = Badge.objects.filter(
        requirement_code__in=['one_month_active', 'six_months_active', 'one_year_active']
    )
    
    for badge in longevity_badges:
        # Get users who don't have this badge yet
        users_without_badge = User.objects.exclude(
            badges__badge=badge
        ).filter(is_active=True)
        
        # Apply criteria specific to each longevity badge
        if badge.requirement_code == 'one_month_active':
            eligible_date = timezone.now() - timedelta(days=30)
            eligible_users = users_without_badge.filter(date_joined__lte=eligible_date)
        elif badge.requirement_code == 'six_months_active':
            eligible_date = timezone.now() - timedelta(days=182)
            eligible_users = users_without_badge.filter(date_joined__lte=eligible_date)
        elif badge.requirement_code == 'one_year_active':
            eligible_date = timezone.now() - timedelta(days=365)
            eligible_users = users_without_badge.filter(date_joined__lte=eligible_date)
        else:
            eligible_users = User.objects.none()
        
        # Award badges to eligible users
        for user in eligible_users:
            user_badge, created = UserBadge.award_badge(user, badge)
            if created:
                badge_count += 1
    
    return f"Awarded {badge_count} badges to users" 