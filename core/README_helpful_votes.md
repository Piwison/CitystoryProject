# Helpful Votes System

This document outlines the Helpful Votes System implemented in the CityStory backend.

## Overview

The Helpful Votes System allows users to mark reviews as helpful, providing valuable feedback about which reviews other users find most useful. This feature enhances user engagement and helps surface the most valuable content to other users.

## Key Features

1. **Vote Toggling**: Users can toggle their "helpful" vote on any review
2. **Vote Tracking**: The system tracks which users found which reviews helpful
3. **Helpful Count**: Each review maintains a count of helpful votes
4. **Notifications**: Review authors are notified when their reviews are marked as helpful
5. **Anti-Self-Voting**: Users are prevented from marking their own reviews as helpful

## Implementation Details

### Models

1. **HelpfulVote Model**:
   - Links a user to a review they found helpful
   - Ensures each user can only vote once per review through `unique_together` constraint
   - Provides a class method `toggle_vote()` for adding/removing votes

2. **Review Model Additions**:
   - Added `helpful_count` field to track the total number of helpful votes
   - Added index on `helpful_count` for efficient sorting

### API Endpoints

1. **Toggle Helpful Vote**:
   - `POST /api/places/{place_id}/reviews/{review_id}/helpful/`
   - Requires authentication
   - Returns the updated helpful count and action taken ('added' or 'removed')

### Business Logic

1. **Vote Toggling**:
   - First request adds a vote
   - Second request removes the vote
   - Third request adds it again, and so on

2. **Helpful Count Maintenance**:
   - The `helpful_count` field is atomically updated using Django's `F()` expressions
   - This prevents race conditions when multiple users vote simultaneously

3. **Validation Rules**:
   - Authenticated users only
   - Users cannot vote on their own reviews
   - Each user can have at most one vote per review

### Notification Integration

When a user marks a review as helpful:
1. A notification is created for the review author
2. The notification includes reference to both the review and the place
3. The notification type is 'review_helpful'

## Usage Examples

### Adding a Helpful Vote (Frontend)

```javascript
// Example React code for toggling a helpful vote
const toggleHelpful = async (placeId, reviewId) => {
  try {
    const response = await api.post(`/api/places/${placeId}/reviews/${reviewId}/helpful/`);
    if (response.data.action === 'added') {
      // Update UI to show active helpful button
    } else {
      // Update UI to show inactive helpful button
    }
    // Update helpful count display
    setHelpfulCount(response.data.helpful_count);
  } catch (error) {
    console.error("Failed to toggle helpful vote:", error);
  }
};
```

### Backend Usage

```python
# Example usage of toggle_vote method
vote_added, helpful_count = HelpfulVote.toggle_vote(review, user)
```

## Testing

The implementation includes comprehensive tests for:
1. Adding and removing helpful votes
2. Multiple users voting on the same review
3. Prevention of self-voting
4. Authentication requirements
5. Proper count maintenance
6. Notification creation

## Future Enhancements

1. **Sort by Helpful**: Enable sorting reviews by helpful count
2. **Badge/Rewards**: Reward users whose reviews frequently receive helpful votes
3. **Helpful Ratio**: Track ratio of views to helpful votes
4. **Reporting**: Add analytics for most helpful reviews and reviewers 