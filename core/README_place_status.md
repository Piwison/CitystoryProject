# Place Status Workflow

This document outlines the Place Status Workflow implemented in the CityStory backend.

## Overview

The Place Status Workflow manages the lifecycle of place submissions - from draft creation through moderation approval or rejection. This ensures quality content on the platform while providing transparency to users about their submission status.

## Status Concepts

Places in CityStory have two related status concepts:

1. **Draft Status** (`draft` boolean field)
   - `true`: The place is a work in progress and only visible to the owner
   - `false`: The place has been submitted for review or already approved

2. **Moderation Status** (`moderation_status` field)
   - `pending`: The place is awaiting review by a moderator
   - `approved`: The place has been reviewed and approved for public display
   - `rejected`: The place has been reviewed and rejected

## Typical Workflow

1. **Creation**: User creates a place (default: `draft=true`, `moderation_status='pending'`)
2. **Publishing**: User publishes the place (`draft=false`, remains `moderation_status='pending'`)
3. **Moderation**: Moderator reviews the place and decides to:
   - Approve (`moderation_status='approved'`) - Place appears publicly
   - Reject (`moderation_status='rejected'`) - Place stays hidden with rejection reason

## API Endpoints

### Place Creation and Publishing

- `POST /api/places/` - Create a new place (defaults to draft)
- `POST /api/places/{id}/publish/` - Submit a draft place for moderation

### Moderation Actions

- `GET /api/moderation/places/` - List places requiring moderation (moderators only)
- `PATCH /api/moderation/places/{id}/status/` - Update moderation status with optional comment

## Visibility Rules

1. **Anonymous Users**: See only approved places
2. **Regular Users**: See approved places + their own draft/pending/rejected places
3. **Moderators**: See all places with full status information

## Notification System

When a place's moderation status changes, the system automatically:

1. Creates a notification for the place owner
2. Records the timestamp and moderator who made the decision
3. Includes any feedback provided by the moderator

## Implementation Details

- The `ModerationMixin` provides shared moderation fields used by places, reviews, and photos
- Draft status is separate from moderation status to allow for user-controlled publishing
- Moderation comments provide valuable feedback to users on rejected submissions
- Cache invalidation ensures users always see the most current status

## Common Testing Scenarios

1. Anonymous users should only see approved places
2. Regular users should see approved places plus their own non-approved places
3. Moderators should be able to view and change status of all places
4. Status changes should generate appropriate notifications
5. API response filtering should respect the visibility rules

## Error Handling

- Attempting to publish an already-published place returns HTTP 400
- Non-moderators attempting to access moderation endpoints receive HTTP 403
- Invalid status transitions are prevented with appropriate error messages 