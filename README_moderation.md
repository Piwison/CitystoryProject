# Moderation System Documentation

This document provides an overview of the moderation system for places, reviews, and photos in the CityStory application.

## Overview

The moderation system ensures that all user-submitted content meets quality standards before becoming publicly visible. The system includes:

1. **Content Status Management**: All user-submitted content (places, reviews, photos) has a moderation status
2. **Admin Interface**: Django admin customized for moderators to review and approve/reject content
3. **Moderation API**: Dedicated endpoints for moderators to review and manage content
4. **Visibility Filtering**: Public endpoints only show approved content by default
5. **User Notifications**: Notifications for content creators about moderation decisions
6. **Status Indicators**: Visual indicators for content creators to see their content's status

## Database Structure

Each model that requires moderation (Place, Review, Photo) includes the following fields:

- `moderation_status` - One of: "pending", "approved", "rejected"
- `moderation_comment` - Optional comment explaining the decision (especially for rejections)
- `moderated_at` - When the content was moderated
- `moderator` - User who moderated the content

## Admin Interface

The Django admin interface is extended to:

- Highlight pending items requiring moderation attention
- Provide actions for bulk approval/rejection
- Sort items by status with pending items shown first
- Include filters for moderation status
- Display moderator information and comments

## Moderation API Endpoints

API endpoints dedicated to moderation tasks:

### Place Moderation

- **GET** `/api/moderation/places/` - List places pending moderation
- **PATCH** `/api/moderation/places/{id}/` - Update place moderation status

### Review Moderation

- **GET** `/api/moderation/reviews/` - List reviews pending moderation
- **PATCH** `/api/moderation/reviews/{id}/` - Update review moderation status

### Photo Moderation

- **GET** `/api/moderation/photos/` - List photos pending moderation
- **PATCH** `/api/moderation/photos/{id}/` - Update photo moderation status

These endpoints use the `ModerationStatusSerializer` which accepts:
- `status`: "pending", "approved", or "rejected"
- `comment`: Optional comment explaining the decision

All moderation endpoints require moderator permissions to access.

## Notification System

The notification system informs users about moderation decisions:

### Notification Types

- `place_approved` - When a place is approved
- `place_rejected` - When a place is rejected
- `review_approved` - When a review is approved
- `review_rejected` - When a review is rejected
- `photo_approved` - When a photo is approved
- `photo_rejected` - When a photo is rejected

### Notification Content

Notifications include:
- Title - Brief description of what happened
- Message - Detailed explanation including:
  - For approvals: Confirmation that content is now public
  - For rejections: Reason for rejection and guidance on what to fix
- Related object information - Links back to the content
- Created timestamp

### Notification Endpoints

- **GET** `/api/notifications/` - List user's notifications
- **POST** `/api/notifications/{id}/mark_read/` - Mark a notification as read
- **POST** `/api/notifications/mark_all_read/` - Mark all notifications as read
- **GET** `/api/notifications/unread_count/` - Get count of unread notifications
- **GET** `/api/user-profile/notification_count/` - Get detailed notification counts by type

## Content Visibility

The system enforces the following visibility rules:

1. **Anonymous Users**: See only approved content
2. **Authenticated Users**: 
   - See all approved content
   - See their own content (any status)
   - Content status indicators on their own content
3. **Moderators/Staff**: See all content with status indicators

## API Response Enhancements

For content owners, API responses include additional fields:

- `is_owner` - Boolean indicating if current user owns the content
- `status_display` - User-friendly status description
- `moderation_status` - Raw status value

## User Interface Considerations

The frontend should:

1. Show status badges on content the user owns
2. Provide notification badges showing unread count
3. Explain to users when their content is pending approval
4. Provide guidance on rejected content for resubmission
5. Show notifications in a centralized notification center

## Points and Rewards

The system awards points to users when their content is approved:

- Approved Place: 20 points
- Approved Review: 10 points
- Approved Photo: 5 points

## Future Enhancements

Planned enhancements (not in current MVP):

1. Email notifications for moderation decisions
2. Automatic content moderation using ML/AI for common issues
3. User reputation system affecting moderation queue priority
4. Appeal process for rejected content 