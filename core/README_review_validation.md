# Review API with Conditional Validation

This document outlines the Review API with Conditional Validation implemented in the CityStory backend.

## Overview

The Review API with Conditional Validation ensures that reviews submitted for different place types contain the appropriate rating information based on the characteristics specific to each type of place. For example, restaurant reviews should include food quality ratings, while hotel reviews should include cleanliness ratings.

## Validation Rules

The validation system enforces the following rules:

1. **All Place Types:**
   - `overall_rating` (1-5): Required for all reviews regardless of place type

2. **Food Establishments (restaurants, cafes, bars):**
   - `food_rating` (1-5): Required
   - `service_rating` (1-5): Required
   - `value_rating` (1-5): Optional but recommended

3. **Hotels:**
   - `cleanliness_rating` (1-5): Required
   - `service_rating` (1-5): Optional but recommended

4. **Attractions:**
   - Only `overall_rating` is required
   - Other ratings are optional

## Implementation Details

The validation logic is implemented in the `PlaceTypeReviewValidator` class which:

1. Examines the place type associated with the review
2. Applies appropriate validation rules based on that type
3. Returns validation errors for any missing required fields
4. Is integrated in both the create and update methods of the `ReviewViewSet`

```python
def validate_review_data(self, place, data):
    errors = {}
    
    # All places require overall_rating
    if 'overall_rating' not in data or data['overall_rating'] is None:
        errors['overall_rating'] = ['Overall rating is required for all places.']
        
    # Food establishments require food and service ratings
    if place.type in ['restaurant', 'cafe', 'bar']:
        if 'food_rating' not in data or data['food_rating'] is None:
            errors['food_rating'] = ['Food quality rating is required for restaurants, cafes, and bars.']
            
        if 'service_rating' not in data or data['service_rating'] is None:
            errors['service_rating'] = ['Service rating is required for restaurants, cafes, and bars.']
            
    # Hotels require cleanliness rating
    if place.type == 'hotel':
        if 'cleanliness_rating' not in data or data['cleanliness_rating'] is None:
            errors['cleanliness_rating'] = ['Cleanliness rating is required for hotels.']
            
    # Return errors dictionary if any errors found, otherwise None
    return errors if errors else None
```

## API Endpoints

The validation is integrated into all review-related endpoints:

1. **Create Review:**
   - `POST /api/places/{place_id}/reviews/`
   - Applies place-specific validation rules
   - Returns 400 Bad Request with field-specific errors if validation fails

2. **Update Review:**
   - `PATCH /api/places/{place_id}/reviews/{review_id}/`
   - `PUT /api/places/{place_id}/reviews/{review_id}/`
   - Ensures updates don't violate place-specific validation rules
   - Returns 400 Bad Request with field-specific errors if validation fails

## Error Responses

When validation fails, the API returns a 400 Bad Request response with a JSON object containing validation errors:

```json
{
  "food_rating": ["Food quality rating is required for restaurants, cafes, and bars."],
  "service_rating": ["Service rating is required for restaurants, cafes, and bars."]
}
```

## Testing

The implementation includes comprehensive tests for various place types and scenarios:

1. Test restaurant review validation (requires food and service ratings)
2. Test hotel review validation (requires cleanliness rating)
3. Test attraction review validation (only requires overall rating)
4. Test validation during review updates
5. Test validation with edge cases (missing required fields) 